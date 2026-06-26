from rest_framework import serializers
from .models import InterviewQuestion


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
