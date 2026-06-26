from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from jobs.models import JobRole
from resume.models import Resume
from .models import ResumeAnalysis
from .serializers import ResumeAnalysisSerializer, ResumeAnalysisCreateSerializer
from .services import analyze_resume


class AnalysisCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResumeAnalysisCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid analysis request',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        resume_id = serializer.validated_data['resume_id']
        job_role_id = serializer.validated_data['job_role_id']

        resume = get_object_or_404(Resume, pk=resume_id, user=request.user)
        job_role = get_object_or_404(JobRole, pk=job_role_id)

        if resume.status != Resume.STATUS_PROCESSED:
            return Response({
                'success': False,
                'message': 'Resume is not processed yet. Please upload or parse the resume again.',
            }, status=status.HTTP_400_BAD_REQUEST)

        if not (resume.extracted_text or '').strip():
            return Response({
                'success': False,
                'message': 'Resume extracted text is empty. Please upload or parse the resume again.',
            }, status=status.HTTP_400_BAD_REQUEST)

        analysis = analyze_resume(resume, job_role)
        return Response({
            'success': True,
            'message': 'Resume analyzed successfully',
            'data': ResumeAnalysisSerializer(analysis).data,
        }, status=status.HTTP_201_CREATED)


class AnalysisDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        analysis = get_object_or_404(ResumeAnalysis, pk=pk)
        if analysis.user != request.user and request.user.role != 'ADMIN':
            return Response({
                'success': False,
                'message': 'Permission denied',
            }, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'success': True,
            'message': 'Analysis fetched successfully',
            'data': ResumeAnalysisSerializer(analysis).data,
        })


class AnalysisByResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, resume_id):
        resume = get_object_or_404(Resume, pk=resume_id)
        if resume.user != request.user and request.user.role != 'ADMIN':
            return Response({
                'success': False,
                'message': 'Permission denied',
            }, status=status.HTTP_403_FORBIDDEN)

        analyses = ResumeAnalysis.objects.filter(resume=resume).order_by('-created_at')
        serializer = ResumeAnalysisSerializer(analyses, many=True)
        return Response({
            'success': True,
            'message': 'Analysis for resume fetched successfully',
            'data': serializer.data,
        })


class AnalysisHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        analyses = ResumeAnalysis.objects.filter(user=request.user).order_by('-created_at')
        serializer = ResumeAnalysisSerializer(analyses, many=True)
        return Response({
            'success': True,
            'message': 'Analysis history fetched successfully',
            'data': serializer.data,
        })
