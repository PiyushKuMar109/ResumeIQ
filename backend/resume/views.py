import os
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Resume, ParsedResume
from .serializers import ResumeUploadSerializer, ResumeSerializer
from .utils import parse_resume


class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid resume upload data',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        title = serializer.validated_data.get('title') or file.name
        ext = os.path.splitext(file.name)[1].lower()
        file_type = 'pdf' if ext == '.pdf' else 'docx' if ext == '.docx' else 'unknown'

        resume = Resume.objects.create(
            user=request.user,
            title=title,
            file=file,
            file_type=file_type,
            status=Resume.STATUS_UPLOADED,
        )

        try:
            resume.file_url = request.build_absolute_uri(resume.file.url)
        except Exception:
            resume.file_url = ''
        resume.save()

        try:
            resume.file.open(mode='rb')
            parse_result = parse_resume(resume.file, file_type)
            resume.extracted_text = parse_result['extracted_text']
            resume.status = Resume.STATUS_PROCESSED
            resume.save()

            ParsedResume.objects.create(resume=resume, **parse_result['parsed'])

            return Response({
                'success': True,
                'message': 'Resume uploaded successfully',
                'data': ResumeSerializer(resume).data,
            }, status=status.HTTP_201_CREATED)

        except Exception as exc:
            resume.status = Resume.STATUS_FAILED
            resume.save()
            return Response({
                'success': False,
                'message': 'Resume parsing failed',
                'errors': str(exc),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResumeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resumes = Resume.objects.filter(user=request.user).order_by('-uploaded_at')
        serializer = ResumeSerializer(resumes, many=True)
        return Response({
            'success': True,
            'message': 'Resumes fetched successfully',
            'data': serializer.data,
        })


class ResumeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Resume, pk=pk, user=user)

    def get(self, request, pk):
        resume = self.get_object(pk, request.user)
        serializer = ResumeSerializer(resume)
        return Response({
            'success': True,
            'message': 'Resume details fetched successfully',
            'data': serializer.data,
        })

    def delete(self, request, pk):
        resume = self.get_object(pk, request.user)
        if resume.file:
            try:
                resume.file.delete(save=False)
            except PermissionError:
                pass
        resume.delete()
        return Response({
            'success': True,
            'message': 'Resume deleted successfully',
        }, status=status.HTTP_200_OK)


class ResumeDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        if resume.file:
            try:
                resume.file.delete(save=False)
            except PermissionError:
                pass
        resume.delete()
        return Response({
            'success': True,
            'message': 'Resume deleted successfully',
        }, status=status.HTTP_200_OK)


class ResumeParseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        if not resume.file:
            return Response({
                'success': False,
                'message': 'Resume file not found',
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            resume.file.open(mode='rb')
            parse_result = parse_resume(resume.file, resume.file_type)
            resume.extracted_text = parse_result['extracted_text']
            resume.status = Resume.STATUS_PROCESSED
            resume.save()

            ParsedResume.objects.update_or_create(
                resume=resume,
                defaults=parse_result['parsed'],
            )
            return Response({
                'success': True,
                'message': 'Resume re-parsed successfully',
                'data': ResumeSerializer(resume).data,
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            resume.status = Resume.STATUS_FAILED
            resume.save()
            return Response({
                'success': False,
                'message': 'Resume parsing failed',
                'errors': str(exc),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
