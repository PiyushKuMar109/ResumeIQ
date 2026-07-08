from rest_framework import serializers
from .models import JobRole, JobRecommendation, JobApplication


class JobRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRole
        fields = ['id', 'title', 'description', 'required_skills', 'keywords', 'experience_level', 'created_at']
        read_only_fields = ['id', 'created_at']


class JobRecommendationSerializer(serializers.ModelSerializer):
    matched_skills = serializers.SerializerMethodField()

    class Meta:
        model = JobRecommendation
        fields = [
            'id', 'job_title', 'company_name', 'match_percentage',
            'required_skills', 'matched_skills', 'missing_skills', 'reason', 'created_at',
        ]
        read_only_fields = fields

    def get_matched_skills(self, obj):
        return getattr(obj, 'matched_skills', [])


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job_title', 'company_name', 'stage', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
