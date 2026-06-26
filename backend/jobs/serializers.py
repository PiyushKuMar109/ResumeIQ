from rest_framework import serializers
from .models import JobRole, JobRecommendation


class JobRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRole
        fields = ['id', 'title', 'description', 'required_skills', 'keywords', 'experience_level', 'created_at']
        read_only_fields = ['id', 'created_at']


class JobRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRecommendation
        fields = [
            'id', 'job_title', 'company_name', 'match_percentage',
            'required_skills', 'missing_skills', 'reason', 'created_at',
        ]
        read_only_fields = fields
