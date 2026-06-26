from django.db.models import Avg, Max
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminRole
from resume.models import Resume
from analysis.models import ResumeAnalysis
from jobs.models import JobRole


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_resumes = Resume.objects.filter(user=request.user).count()
        analyses = ResumeAnalysis.objects.filter(user=request.user)
        total_analyses = analyses.count()
        average_ats_score = analyses.aggregate(Avg('ats_score'))['ats_score__avg'] or 0
        best_score = analyses.aggregate(Max('ats_score'))['ats_score__max'] or 0
        latest_resume = Resume.objects.filter(user=request.user).order_by('-uploaded_at').first()
        latest_resume_data = {
            'id': latest_resume.id,
            'title': latest_resume.title,
            'uploaded_at': latest_resume.uploaded_at,
            'status': latest_resume.status,
        } if latest_resume else None
        recent_analyses = [
            {
                'id': item.id,
                'resume_title': item.resume.title,
                'job_role': item.job_role.title,
                'ats_score': item.ats_score,
                'created_at': item.created_at,
            }
            for item in analyses.order_by('-created_at')[:5]
        ]

        return Response({
            'success': True,
            'message': 'Dashboard summary fetched successfully',
            'data': {
                'total_resumes': total_resumes,
                'total_analyses': total_analyses,
                'average_ats_score': round(average_ats_score, 2),
                'best_score': round(best_score, 2),
                'latest_resume': latest_resume_data,
                'recent_analyses': recent_analyses,
            },
        })


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        total_users = request.user.__class__.objects.count()
        total_resumes = Resume.objects.count()
        total_analyses = ResumeAnalysis.objects.count()
        average_ats_score = ResumeAnalysis.objects.aggregate(Avg('ats_score'))['ats_score__avg'] or 0
        top_missing = ResumeAnalysis.objects.values_list('missing_skills', flat=True)
        missing_skill_counts = {}
        for skills in top_missing:
            for skill in skills or []:
                missing_skill_counts[skill] = missing_skill_counts.get(skill, 0) + 1
        top_missing_skills = sorted(missing_skill_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        popular_job_roles = (
            JobRole.objects.order_by('-created_at').values('title')[:5]
        )

        return Response({
            'success': True,
            'message': 'Admin dashboard summary fetched successfully',
            'data': {
                'total_users': total_users,
                'total_resumes': total_resumes,
                'total_analyses': total_analyses,
                'average_ats_score': round(average_ats_score, 2),
                'top_missing_skills': [skill for skill, _ in top_missing_skills],
                'popular_job_roles': [role['title'] for role in popular_job_roles],
            },
        })
