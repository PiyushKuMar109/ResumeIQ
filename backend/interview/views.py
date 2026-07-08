from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone

from .models import (
    InterviewQuestion,
    MockInterviewSession,
    MockInterviewQuestionAnswer,
    InterviewerProfile,
    AvailabilitySlot,
    Booking,
    CreditTransaction
)
from .serializers import (
    InterviewQuestionSerializer,
    InterviewGenerateSerializer,
    MockInterviewSessionSerializer,
    MockInterviewSessionDetailSerializer,
    MockInterviewStartSerializer,
    MockInterviewAnswerSerializer,
    MockInterviewQuestionAnswerSerializer,
    InterviewerProfileSerializer,
    AvailabilitySlotSerializer,
    BookingSerializer,
    CreditTransactionSerializer
)
from jobs.models import JobRole
from resume.models import Resume
from services.gemini_service import (
    generate_interview_questions,
    generate_mock_questions,
    evaluate_interview_answer,
)


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


class MockInterviewStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MockInterviewStartSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid payload',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        resume_id = serializer.validated_data['resume_id']
        job_title = serializer.validated_data['job_title']

        resume = get_object_or_404(Resume, pk=resume_id, user=request.user)
        if not (resume.extracted_text or '').strip():
            return Response({
                'success': False,
                'message': 'Resume content is empty. Please parse it first.',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            questions = generate_mock_questions(resume.extracted_text, job_title)
            
            session = MockInterviewSession.objects.create(
                user=request.user,
                resume=resume,
                job_title=job_title,
                status=MockInterviewSession.STATUS_STARTED,
            )

            for q in questions:
                MockInterviewQuestionAnswer.objects.create(
                    session=session,
                    question_text=q.get('question_text', ''),
                    answer_hint=q.get('answer_hint', ''),
                    question_type=q.get('question_type', 'TECHNICAL'),
                )

            return Response({
                'success': True,
                'message': 'Mock interview session started successfully',
                'data': MockInterviewSessionDetailSerializer(session).data,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to start mock interview session',
                'errors': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MockInterviewAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        session = get_object_or_404(MockInterviewSession, pk=pk, user=request.user)
        serializer = MockInterviewAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid answer payload',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        qa_id = serializer.validated_data['qa_id']
        user_answer = serializer.validated_data['user_answer']

        qa = get_object_or_404(MockInterviewQuestionAnswer, pk=qa_id, session=session)

        try:
            evaluation = evaluate_interview_answer(qa.question_text, user_answer, qa.answer_hint)
            
            qa.user_answer = user_answer
            qa.answered_at = timezone.now()
            qa.score = evaluation.get('score', 0.0)
            qa.feedback = evaluation.get('feedback', '')
            qa.model_answer = evaluation.get('model_answer', '')
            qa.save()

            # Check if session is complete
            total_questions = session.qa_pairs.count()
            answered_questions = session.qa_pairs.exclude(user_answer__isnull=True).exclude(user_answer='').count()

            earned_credits = 0
            if answered_questions >= total_questions:
                session.status = MockInterviewSession.STATUS_COMPLETED
                session.save()

                # Calculate performance-based credits
                scores = [item.score for item in session.qa_pairs.all() if item.score is not None]
                if scores:
                    avg_score = sum(scores) / len(scores)
                    if avg_score >= 80:
                        earned_credits = 25
                    elif avg_score >= 60:
                        earned_credits = 15
                    elif avg_score >= 40:
                        earned_credits = 10
                    else:
                        earned_credits = 5
                    
                    # Award user
                    request.user.credits += earned_credits
                    request.user.save()

                    # Log Tx
                    CreditTransaction.objects.create(
                        user=request.user,
                        amount=earned_credits,
                        transaction_type='AI_INTERVIEW'
                    )

            return Response({
                'success': True,
                'message': 'Answer submitted and evaluated successfully',
                'data': MockInterviewQuestionAnswerSerializer(qa).data,
                'session_completed': session.status == MockInterviewSession.STATUS_COMPLETED,
                'credits_earned': earned_credits,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to evaluate answer',
                'errors': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MockInterviewSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        session = get_object_or_404(MockInterviewSession, pk=pk, user=request.user)
        return Response({
            'success': True,
            'message': 'Mock interview session fetched successfully',
            'data': MockInterviewSessionDetailSerializer(session).data,
        })

    def delete(self, request, pk):
        session = get_object_or_404(MockInterviewSession, pk=pk, user=request.user)
        session.delete()
        return Response({
            'success': True,
            'message': 'Mock interview session deleted successfully',
        }, status=status.HTTP_200_OK)


class MockInterviewSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = MockInterviewSession.objects.filter(user=request.user).order_by('-created_at')
        serializer = MockInterviewSessionDetailSerializer(sessions, many=True)
        return Response({
            'success': True,
            'message': 'Mock sessions fetched successfully',
            'data': serializer.data,
        })


class InterviewerProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profiles = InterviewerProfile.objects.all().order_by('-created_at')
        serializer = InterviewerProfileSerializer(profiles, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def post(self, request):
        # Create or update interviewer profile
        profile, created = InterviewerProfile.objects.get_or_create(user=request.user)
        serializer = InterviewerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Also update user role to ADMIN or INTERVIEWER or keep role as USER and manage via profile
            # Let's update user's role to mark them as interviewer if desired
            request.user.role = 'USER' # Keep default but can be extended
            request.user.save()
            return Response({
                'success': True,
                'message': 'Interviewer profile updated successfully',
                'data': serializer.data
            })
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class AvailabilitySlotView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, interviewer_id=None):
        if interviewer_id:
            slots = AvailabilitySlot.objects.filter(interviewer_id=interviewer_id, is_booked=False)
        else:
            # interviewer fetching their own slots
            profile = get_object_or_404(InterviewerProfile, user=request.user)
            slots = AvailabilitySlot.objects.filter(interviewer=profile)
        serializer = AvailabilitySlotSerializer(slots, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def post(self, request):
        profile = get_object_or_404(InterviewerProfile, user=request.user)
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')

        if not start_time or not end_time:
            return Response({'success': False, 'message': 'start_time and end_time are required'}, status=status.HTTP_400_BAD_REQUEST)

        slot = AvailabilitySlot.objects.create(
            interviewer=profile,
            start_time=start_time,
            end_time=end_time,
            is_booked=False
        )
        return Response({
            'success': True,
            'data': AvailabilitySlotSerializer(slot).data
        }, status=status.HTTP_201_CREATED)


class BookSlotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slot_id):
        slot = get_object_or_404(AvailabilitySlot, pk=slot_id)
        if slot.is_booked:
            return Response({'success': False, 'message': 'Slot is already booked'}, status=status.HTTP_400_BAD_REQUEST)

        candidate = request.user
        interviewer = slot.interviewer

        if candidate == interviewer.user:
            return Response({'success': False, 'message': 'You cannot book your own slot'}, status=status.HTTP_400_BAD_REQUEST)

        cost = interviewer.credit_rate

        if candidate.credits < cost:
            return Response({
                'success': False,
                'message': f'Insufficient credits. Needed {cost}, you have {candidate.credits}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Atomic transaction for credit deduction & slot booking
        try:
            with transaction.atomic():
                # Lock slot and candidate user rows
                slot = AvailabilitySlot.objects.select_for_update().get(pk=slot.pk)
                if slot.is_booked:
                    return Response({'success': False, 'message': 'Slot was just booked by someone else'}, status=status.HTTP_400_BAD_REQUEST)

                # Deduct credits
                candidate.credits -= cost
                candidate.save()

                # Add interviewer credits
                interviewer.user.credits += cost
                interviewer.user.save()

                # Mark slot as booked
                slot.is_booked = True
                slot.save()

                # Create Booking
                booking = Booking.objects.create(
                    candidate=candidate,
                    interviewer=interviewer,
                    slot=slot,
                    status='SCHEDULED',
                    credits_charged=cost,
                    session_type='PEER'
                )

                # Log transactions
                CreditTransaction.objects.create(
                    user=candidate,
                    amount=-cost,
                    transaction_type='PEER_BOOKING'
                )
                CreditTransaction.objects.create(
                    user=interviewer.user,
                    amount=cost,
                    transaction_type='PEER_EARNING'
                )

            return Response({
                'success': True,
                'message': 'Slot booked successfully',
                'data': BookingSerializer(booking).data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to execute transaction',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(candidate=request.user).order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class InterviewerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_object_or_404(InterviewerProfile, user=request.user)
        slots = AvailabilitySlot.objects.filter(interviewer=profile)
        bookings = Booking.objects.filter(interviewer=profile).order_by('-created_at')
        
        # Calculate total earnings from transactions
        earnings = CreditTransaction.objects.filter(user=request.user, transaction_type='PEER_EARNING')
        total_earned = sum(tx.amount for tx in earnings)

        return Response({
            'success': True,
            'data': {
                'profile': InterviewerProfileSerializer(profile).data,
                'total_earned': total_earned,
                'bookings_count': bookings.count(),
                'slots_count': slots.count(),
                'bookings': BookingSerializer(bookings, many=True).data,
                'slots': AvailabilitySlotSerializer(slots, many=True).data
            }
        })


class AddCreditsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Restrict to one-time free credit package claim
        if CreditTransaction.objects.filter(user=request.user, transaction_type='CREDIT_ADD').exists():
            return Response({
                'success': False,
                'message': 'You have already claimed your one-time free credits package.'
            }, status=status.HTTP_400_BAD_REQUEST)

        amount = request.data.get('amount', 50)
        try:
            amount = int(amount)
        except ValueError:
            return Response({'success': False, 'message': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.credits += amount
        user.save()

        CreditTransaction.objects.create(
            user=user,
            amount=amount,
            transaction_type='CREDIT_ADD'
        )

        return Response({
            'success': True,
            'message': f'Successfully added {amount} credits',
            'credits': user.credits
        })


