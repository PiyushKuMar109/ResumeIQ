from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import JobRole, JobRecommendation
from .serializers import JobRoleSerializer, JobRecommendationSerializer
from accounts.permissions import IsAdminRole
from resume.models import Resume
from .management.commands.seed_job_roles import JOB_ROLES


def _ensure_job_roles_seeded():
    if JobRole.objects.exists():
        return

    for item in JOB_ROLES:
        JobRole.objects.get_or_create(title=item['title'], defaults=item)


def _build_match_percentage(parsed_skills, required_skills, keywords, resume_text):
    matched_skills = [skill for skill in required_skills if skill.lower() in [s.lower() for s in parsed_skills]]
    missing_skills = [skill for skill in required_skills if skill not in matched_skills]
    skill_score = len(matched_skills) / max(len(required_skills), 1)
    keyword_matches = sum(1 for keyword in keywords if keyword.lower() in resume_text.lower())
    keyword_score = keyword_matches / max(len(keywords), 1)
    match_percentage = round((skill_score * 0.7 + keyword_score * 0.3) * 100, 2)
    return match_percentage, matched_skills, missing_skills


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
            match_percentage, matched_skills, missing_skills = _build_match_percentage(
                parsed_resume.skills or [],
                role.required_skills or [],
                role.keywords or [],
                resume.extracted_text or '',
            )
            reason = (
                f"Your resume matched {len(matched_skills)} required skills for {role.title}. "
                f"Missing skills: {', '.join(missing_skills)}." if missing_skills else
                f"Your resume is a strong match for {role.title}."
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
            recommendations.append(rec)

        recommendations.sort(key=lambda item: item.match_percentage, reverse=True)
        top_recommendations = recommendations[:5]
        serializer = JobRecommendationSerializer(top_recommendations, many=True)

        return Response({
            'success': True,
            'message': 'Job recommendations created successfully',
            'data': serializer.data,
        }, status=status.HTTP_200_OK)
