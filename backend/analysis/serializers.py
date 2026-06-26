from rest_framework import serializers
from .models import ResumeAnalysis
from resume.serializers import ResumeSerializer
from jobs.serializers import JobRoleSerializer


class ResumeAnalysisSerializer(serializers.ModelSerializer):
    resume = ResumeSerializer(read_only=True)
    job_role = JobRoleSerializer(read_only=True)
    resume_id = serializers.IntegerField(source='resume.id', read_only=True)
    job_role_id = serializers.IntegerField(source='job_role.id', read_only=True)

    class Meta:
        model = ResumeAnalysis
        fields = [
            'id', 'resume_id', 'job_role_id', 'resume', 'job_role', 'ats_score', 'skills_score', 'keywords_score',
            'projects_score', 'experience_score', 'education_score', 'formatting_score',
            'matched_skills', 'missing_skills', 'suggestions', 'job_match_percentage',
            'created_at',
        ]
        read_only_fields = fields


class ResumeAnalysisCreateSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField()
    job_role_id = serializers.IntegerField()
