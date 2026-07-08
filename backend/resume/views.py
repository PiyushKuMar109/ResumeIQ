import os
import os
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Resume, ParsedResume, TailoredResume
from .serializers import (
    ResumeUploadSerializer,
    ResumeSerializer,
    TailoredResumeSerializer,
    TailoredResumeCreateSerializer,
    CoverLetterRequestSerializer,
)
from .utils import parse_resume
from services.gemini_service import (
    generate_tailored_resume,
    generate_cover_letter,
    generate_career_roadmap,
    analyze_keyword_density,
    refactor_interview_code,
)


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


class TailoredResumeCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        if resume.status != Resume.STATUS_PROCESSED:
            return Response({
                'success': False,
                'message': 'Resume is not processed. Please parse the resume first.',
            }, status=status.HTTP_400_BAD_REQUEST)

        parsed_data = getattr(resume, 'parsed_data', None)
        if not parsed_data:
            return Response({
                'success': False,
                'message': 'Parsed resume data not found.',
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = TailoredResumeCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid data',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        job_title = serializer.validated_data['job_title']
        job_description = serializer.validated_data['job_description']

        # Call Gemini service to tailor resume
        parsed_resume_dict = {
            'skills': parsed_data.skills or [],
            'experience': parsed_data.experience or [],
            'projects': parsed_data.projects or [],
        }
        
        try:
            tailored_data = generate_tailored_resume(parsed_resume_dict, job_title, job_description)
            
            # Save TailoredResume object
            tailored_resume = TailoredResume.objects.create(
                user=request.user,
                original_resume=resume,
                job_title=job_title,
                job_description=job_description,
                summary=tailored_data.get('summary', ''),
                experience=tailored_data.get('experience', []),
                projects=tailored_data.get('projects', []),
                skills=tailored_data.get('skills', []),
                match_score=tailored_data.get('match_score', 0.0),
                suggestions=tailored_data.get('suggestions', []),
            )
            
            return Response({
                'success': True,
                'message': 'Resume tailored successfully',
                'data': TailoredResumeSerializer(tailored_resume).data,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to generate tailored resume suggestions.',
                'errors': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TailoredResumeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resumes = TailoredResume.objects.filter(user=request.user).order_by('-created_at')
        serializer = TailoredResumeSerializer(resumes, many=True)
        return Response({
            'success': True,
            'message': 'Tailored resumes fetched successfully',
            'data': serializer.data,
        })


class TailoredResumeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tailored = get_object_or_404(TailoredResume, pk=pk, user=request.user)
        return Response({
            'success': True,
            'message': 'Tailored resume fetched successfully',
            'data': TailoredResumeSerializer(tailored).data,
        })

    def delete(self, request, pk):
        tailored = get_object_or_404(TailoredResume, pk=pk, user=request.user)
        tailored.delete()
        return Response({
            'success': True,
            'message': 'Tailored resume deleted successfully',
        }, status=status.HTTP_200_OK)


class CoverLetterCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CoverLetterRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid cover letter request payload',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        resume_id = serializer.validated_data['resume_id']
        job_title = serializer.validated_data['job_title']
        company_name = serializer.validated_data['company_name']
        job_description = serializer.validated_data.get('job_description', '')

        resume = get_object_or_404(Resume, pk=resume_id, user=request.user)
        if not (resume.extracted_text or '').strip():
            return Response({
                'success': False,
                'message': 'Resume has no text content. Please parse it first.',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            letter_data = generate_cover_letter(
                resume.extracted_text,
                job_title,
                company_name,
                job_description
            )
            return Response({
                'success': True,
                'message': 'Cover letter and outreach email generated successfully',
                'data': letter_data,
            }, status=status.HTTP_250_CREATED if hasattr(status, 'HTTP_250_CREATED') else status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to generate cover letter',
                'errors': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CareerRoadmapView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_id = request.data.get('resume_id')
        if not resume_id:
            return Response({
                'success': False,
                'message': 'resume_id is required',
            }, status=status.HTTP_400_BAD_REQUEST)

        resume = get_object_or_404(Resume, pk=resume_id, user=request.user)
        if not (resume.extracted_text or '').strip():
            return Response({
                'success': False,
                'message': 'Resume content is empty. Please parse it first.',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            roadmap_data = generate_career_roadmap(resume.extracted_text)
            return Response({
                'success': True,
                'data': roadmap_data,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to generate career roadmap',
                'errors': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class KeywordDensityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = request.data.get('job_description')

        if not resume_id or not job_description:
            return Response({
                'success': False,
                'message': 'resume_id and job_description are required',
            }, status=status.HTTP_400_BAD_REQUEST)

        resume = get_object_or_404(Resume, pk=resume_id, user=request.user)
        if not (resume.extracted_text or '').strip():
            return Response({
                'success': False,
                'message': 'Resume content is empty. Please parse it first.',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            density_data = analyze_keyword_density(resume.extracted_text, job_description)
            return Response({
                'success': True,
                'data': density_data,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to analyze keyword density',
                'errors': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CodeRefactorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code_text = request.data.get('code_text')
        language = request.data.get('language', 'python')

        if not code_text:
            return Response({
                'success': False,
                'message': 'code_text is required',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            refactored_data = refactor_interview_code(code_text, language)
            return Response({
                'success': True,
                'data': refactored_data,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to refactor code',
                'errors': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


