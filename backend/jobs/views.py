from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import JobRole, JobRecommendation, JobApplication
from .serializers import JobRoleSerializer, JobRecommendationSerializer, JobApplicationSerializer
from accounts.permissions import IsAdminRole
from resume.models import Resume
from .management.commands.seed_job_roles import JOB_ROLES


def _ensure_job_roles_seeded():
    if JobRole.objects.exists():
        return

    for item in JOB_ROLES:
        JobRole.objects.get_or_create(title=item['title'], defaults=item)


def _build_match_percentage(parsed_skills, required_skills, keywords, resume_text):
    normalized_resume_skills = {skill.lower(): skill for skill in parsed_skills}
    matched_skills = []
    missing_skills = []
    
    # Enhanced skill matching with partial matches
    for skill in required_skills:
        skill_lower = skill.lower()
        # Exact match
        if skill_lower in normalized_resume_skills:
            matched_skills.append(skill)
        # Partial match (e.g., "React" matches "React.js" or "React Native")
        elif any(skill_lower in resume_skill.lower() or resume_skill.lower() in skill_lower 
                 for resume_skill in parsed_skills):
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)
    
    skill_score = len(matched_skills) / max(len(required_skills), 1)
    keyword_matches = sum(1 for keyword in keywords if keyword.lower() in resume_text.lower())
    keyword_score = keyword_matches / max(len(keywords), 1)
    
    # Dynamic bonus based on skill coverage
    coverage_ratio = len(matched_skills) / max(len(required_skills), 1)
    if coverage_ratio >= 0.8:
        bonus_score = 0.12
    elif coverage_ratio >= 0.5:
        bonus_score = 0.08
    elif coverage_ratio >= 0.3:
        bonus_score = 0.05
    else:
        bonus_score = 0
    
    match_percentage = round(min(1, (skill_score * 0.70 + keyword_score * 0.20 + bonus_score)) * 100, 2)
    return match_percentage, matched_skills, missing_skills, keyword_matches


class JobRoleListCreateView(generics.ListCreateAPIView):
    queryset = JobRole.objects.all().order_by('title')
    serializer_class = JobRoleSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        _ensure_job_roles_seeded()
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response({
            'success': True,
            'message': 'Job roles fetched successfully',
            'data': serializer.data,
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'message': 'Job role created successfully',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class JobRoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = JobRoleSerializer
    queryset = JobRole.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]


class JobRecommendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_id = request.data.get('resume_id')
        if not resume_id:
            return Response({
                'success': False,
                'message': 'resume_id is required',
            }, status=status.HTTP_400_BAD_REQUEST)

        resume = get_object_or_404(Resume, pk=resume_id, user=request.user)
        parsed_resume = getattr(resume, 'parsed_data', None)
        if not parsed_resume:
            return Response({
                'success': False,
                'message': 'Resume has not been parsed yet',
            }, status=status.HTTP_400_BAD_REQUEST)

        _ensure_job_roles_seeded()
        job_roles = JobRole.objects.all()
        recommendations = []
        JobRecommendation.objects.filter(user=request.user, resume=resume).delete()

        for role in job_roles:
            match_percentage, matched_skills, missing_skills, keyword_matches = _build_match_percentage(
                parsed_resume.skills or [],
                role.required_skills or [],
                role.keywords or [],
                resume.extracted_text or '',
            )
            reason = (
                f"Matched {len(matched_skills)} skills and {keyword_matches} keywords for {role.title}. "
                f"Top matching skills: {', '.join(matched_skills[:4]) or 'none yet'}. "
                f"Missing skills: {', '.join(missing_skills[:4]) or 'none'}."
            )
            rec = JobRecommendation.objects.create(
                user=request.user,
                resume=resume,
                job_title=role.title,
                company_name='AI Resume Matches',
                match_percentage=match_percentage,
                required_skills=role.required_skills or [],
                missing_skills=missing_skills,
                reason=reason,
            )
            rec.matched_skills = matched_skills
            recommendations.append(rec)

        recommendations.sort(key=lambda item: item.match_percentage, reverse=True)
        top_recommendations = [item for item in recommendations if item.match_percentage > 0][:8] or recommendations[:8]
        serializer = JobRecommendationSerializer(top_recommendations, many=True)

        return Response({
            'success': True,
            'message': 'Job recommendations created successfully',
            'data': serializer.data,
        }, status=status.HTTP_200_OK)


class JobApplicationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        apps = JobApplication.objects.filter(user=request.user).order_by('-updated_at')
        serializer = JobApplicationSerializer(apps, many=True)
        return Response({
            'success': True,
            'message': 'Job applications fetched successfully',
            'data': serializer.data,
        })

    def post(self, request):
        serializer = JobApplicationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid payload',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        job_app = JobApplication.objects.create(
            user=request.user,
            job_title=serializer.validated_data['job_title'],
            company_name=serializer.validated_data['company_name'],
            stage=serializer.validated_data.get('stage', 'BOOKMARKED'),
            notes=serializer.validated_data.get('notes', ''),
        )
        return Response({
            'success': True,
            'message': 'Job application created successfully',
            'data': JobApplicationSerializer(job_app).data,
        }, status=status.HTTP_201_CREATED)


class JobApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        job_app = get_object_or_404(JobApplication, pk=pk, user=request.user)
        return Response({
            'success': True,
            'message': 'Job application fetched successfully',
            'data': JobApplicationSerializer(job_app).data,
        })

    def put(self, request, pk):
        job_app = get_object_or_404(JobApplication, pk=pk, user=request.user)
        serializer = JobApplicationSerializer(job_app, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid update payload',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'success': True,
            'message': 'Job application updated successfully',
            'data': serializer.data,
        })

    def delete(self, request, pk):
        job_app = get_object_or_404(JobApplication, pk=pk, user=request.user)
        job_app.delete()
        return Response({
            'success': True,
            'message': 'Job application deleted successfully',
        }, status=status.HTTP_200_OK)

