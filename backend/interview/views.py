from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import InterviewQuestion
from .serializers import InterviewQuestionSerializer, InterviewGenerateSerializer
from jobs.models import JobRole
from resume.models import Resume
from services.gemini_service import generate_interview_questions


class InterviewGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InterviewGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid request payload',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        resume = get_object_or_404(Resume, pk=serializer.validated_data['resume_id'], user=request.user)
        job_role = get_object_or_404(JobRole, pk=serializer.validated_data['job_role_id'])
        difficulty = serializer.validated_data['difficulty']

        parsed_resume = getattr(resume, 'parsed_data', None)
        if not parsed_resume:
            return Response({
                'success': False,
                'message': 'Resume must be parsed before generating interview questions',
            }, status=status.HTTP_400_BAD_REQUEST)

        questions = generate_interview_questions(resume.extracted_text or '', {
            'title': job_role.title,
            'required_skills': job_role.required_skills or [],
        }, difficulty)

        InterviewQuestion.objects.filter(
            user=request.user,
            resume=resume,
            job_role=job_role,
            difficulty=difficulty,
        ).delete()

        saved_questions = []
        for item in questions:
            question_type = item.get('question_type') or 'TECHNICAL'
            if question_type not in dict(InterviewQuestion.QUESTION_TYPE_CHOICES):
                question_type = 'TECHNICAL'
            difficulty_level = item.get('difficulty') or difficulty
            if difficulty_level not in dict(InterviewQuestion.DIFFICULTY_CHOICES):
                difficulty_level = difficulty
            iq = InterviewQuestion.objects.create(
                user=request.user,
                resume=resume,
                job_role=job_role,
                question=item.get('question', ''),
                answer_hint=item.get('answer_hint', ''),
                question_type=question_type,
                difficulty=difficulty_level,
            )
            saved_questions.append(iq)

        serializer = InterviewQuestionSerializer(saved_questions, many=True)
        return Response({
            'success': True,
            'message': 'Interview questions generated successfully',
            'data': serializer.data,
        }, status=status.HTTP_201_CREATED)


class InterviewByResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, resume_id):
        resume = get_object_or_404(Resume, pk=resume_id)
        if resume.user != request.user and request.user.role != 'ADMIN':
            return Response({
                'success': False,
                'message': 'Permission denied',
            }, status=status.HTTP_403_FORBIDDEN)

        questions = InterviewQuestion.objects.filter(resume=resume).order_by('-created_at')
        serializer = InterviewQuestionSerializer(questions, many=True)
        return Response({
            'success': True,
            'message': 'Interview questions fetched successfully',
            'data': serializer.data,
        })


class InterviewDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        interview = get_object_or_404(InterviewQuestion, pk=pk)
        if interview.user != request.user and request.user.role != 'ADMIN':
            return Response({
                'success': False,
                'message': 'Permission denied',
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = InterviewQuestionSerializer(interview)
        return Response({
            'success': True,
            'message': 'Interview question fetched successfully',
            'data': serializer.data,
        })
