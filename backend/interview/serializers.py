from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    InterviewQuestion,
    MockInterviewSession,
    MockInterviewQuestionAnswer,
    InterviewerProfile,
    AvailabilitySlot,
    Booking,
    CreditTransaction
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    is_interviewer = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'credits', 'is_interviewer']

    def get_is_interviewer(self, obj):
        return hasattr(obj, 'interviewer_profile')


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = [
            'id', 'resume', 'job_role', 'question', 'answer_hint',
            'question_type', 'difficulty', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class InterviewGenerateSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField()
    job_role_id = serializers.IntegerField()
    difficulty = serializers.ChoiceField(choices=[('EASY', 'Easy'), ('MEDIUM', 'Medium'), ('HARD', 'Hard')])


class MockInterviewQuestionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = MockInterviewQuestionAnswer
        fields = [
            'id', 'session', 'question_text', 'answer_hint', 'question_type',
            'user_answer', 'answered_at', 'score', 'feedback', 'model_answer',
        ]
        read_only_fields = ['id']


class MockInterviewSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MockInterviewSession
        fields = ['id', 'resume', 'job_title', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class MockInterviewSessionDetailSerializer(serializers.ModelSerializer):
    qa_pairs = MockInterviewQuestionAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = MockInterviewSession
        fields = ['id', 'resume', 'job_title', 'status', 'created_at', 'qa_pairs']
        read_only_fields = ['id', 'created_at', 'qa_pairs']


class MockInterviewStartSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField()
    job_title = serializers.CharField(max_length=255)


class MockInterviewAnswerSerializer(serializers.Serializer):
    qa_id = serializers.IntegerField()
    user_answer = serializers.CharField()


class InterviewerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = InterviewerProfile
        fields = ['id', 'user', 'bio', 'company', 'title', 'skills', 'credit_rate', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilitySlot
        fields = ['id', 'interviewer', 'start_time', 'end_time', 'is_booked', 'created_at']
        read_only_fields = ['id', 'is_booked', 'created_at']


class BookingSerializer(serializers.ModelSerializer):
    candidate = UserSerializer(read_only=True)
    interviewer = InterviewerProfileSerializer(read_only=True)
    slot_detail = AvailabilitySlotSerializer(source='slot', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'candidate', 'interviewer', 'slot', 'slot_detail', 'status', 'credits_charged', 'session_type', 'created_at']
        read_only_fields = ['id', 'candidate', 'interviewer', 'credits_charged', 'created_at']


class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = ['id', 'user', 'amount', 'transaction_type', 'created_at']
        read_only_fields = ['id', 'created_at']


