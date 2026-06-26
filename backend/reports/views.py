import io
import os
from django.shortcuts import get_object_or_404
from django.core.files.base import ContentFile
from django.http import FileResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from .models import Report
from .serializers import ReportSerializer
from analysis.models import ResumeAnalysis
from jobs.models import JobRecommendation
from interview.models import InterviewQuestion


class ReportGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        analysis_id = request.data.get('analysis_id')
        if not analysis_id:
            return Response({
                'success': False,
                'message': 'analysis_id is required',
            }, status=status.HTTP_400_BAD_REQUEST)

        analysis = get_object_or_404(ResumeAnalysis, pk=analysis_id)
        if analysis.user != request.user and request.user.role != 'ADMIN':
            return Response({
                'success': False,
                'message': 'Permission denied',
            }, status=status.HTTP_403_FORBIDDEN)

        recommendations = list(
            JobRecommendation.objects.filter(user=analysis.user, resume=analysis.resume)
            .order_by('-match_percentage')[:5]
        )
        interview_questions = list(
            InterviewQuestion.objects.filter(
                user=analysis.user,
                resume=analysis.resume,
                job_role=analysis.job_role,
            ).order_by('question_type', 'created_at')
        )

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setFont('Helvetica-Bold', 16)
        p.drawString(40, 750, 'AI Resume Analyzer Report')
        p.setFont('Helvetica', 12)
        p.drawString(40, 726, f'Report for: {analysis.user.full_name or analysis.user.email}')
        p.drawString(40, 708, f'Resume: {analysis.resume.title}')
        p.drawString(40, 690, f'Job Role: {analysis.job_role.title}')
        p.drawString(40, 672, f'ATS Score: {analysis.ats_score}%')

        y = 650
        sections = [
            ('Skills Score', analysis.skills_score),
            ('Keywords Score', analysis.keywords_score),
            ('Projects Score', analysis.projects_score),
            ('Experience Score', analysis.experience_score),
            ('Education Score', analysis.education_score),
            ('Formatting Score', analysis.formatting_score),
        ]
        for label, value in sections:
            p.drawString(40, y, f'{label}: {value}')
            y -= 18

        y -= 10
        p.drawString(40, y, 'Matched Skills:')
        y -= 18
        p.drawString(60, y, ', '.join(analysis.matched_skills or []))
        y -= 30
        p.drawString(40, y, 'Missing Skills:')
        y -= 18
        p.drawString(60, y, ', '.join(analysis.missing_skills or []))
        y -= 30
        p.drawString(40, y, 'Suggestions:')
        y -= 18
        for suggestion in analysis.suggestions or []:
            p.drawString(60, y, f'- {suggestion}')
            y -= 16
            if y < 60:
                p.showPage()
                y = 740

        if recommendations:
            y -= 10
            p.drawString(40, y, 'Job Recommendations:')
            y -= 18
            for rec in recommendations:
                p.drawString(60, y, f'- {rec.job_title}: {rec.match_percentage}% match')
                y -= 16
                if y < 60:
                    p.showPage()
                    y = 740

        if interview_questions:
            y -= 10
            p.drawString(40, y, 'Interview Questions:')
            y -= 18
            for question in interview_questions[:8]:
                line = f'- [{question.question_type}] {question.question[:85]}'
                p.drawString(60, y, line)
                y -= 16
                if y < 60:
                    p.showPage()
                    y = 740

        p.showPage()
        p.save()
        buffer.seek(0)

        filename = f'report_{analysis.pk}.pdf'
        Report.objects.filter(user=request.user, analysis=analysis).delete()
        report = Report.objects.create(user=request.user, resume=analysis.resume, analysis=analysis)
        report.report_file.save(filename, ContentFile(buffer.read()))
        report.report_url = request.build_absolute_uri(report.report_file.url)
        report.save()

        return Response({
            'success': True,
            'message': 'Report generated successfully',
            'data': {
                'id': report.id,
                'download_url': report.report_url,
            },
        }, status=status.HTTP_201_CREATED)


class ReportListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = Report.objects.filter(user=request.user).order_by('-created_at')
        serializer = ReportSerializer(reports, many=True)
        return Response({
            'success': True,
            'message': 'Reports fetched successfully',
            'data': serializer.data,
        })


class ReportDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        if report.user != request.user and request.user.role != 'ADMIN':
            return Response({
                'success': False,
                'message': 'Permission denied',
            }, status=status.HTTP_403_FORBIDDEN)

        if not report.report_file:
            return Response({
                'success': False,
                'message': 'Report file not found',
            }, status=status.HTTP_404_NOT_FOUND)

        report.report_file.open('rb')
        return FileResponse(
            report.report_file,
            as_attachment=False,
            filename=os.path.basename(report.report_file.name),
            content_type='application/pdf',
        )
