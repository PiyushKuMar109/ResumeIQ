from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    resume_title = serializers.CharField(source='resume.title', read_only=True)
    analysis_id = serializers.IntegerField(source='analysis.id', read_only=True)
    download_url = serializers.CharField(source='report_url', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id',
            'title',
            'resume',
            'resume_title',
            'analysis',
            'analysis_id',
            'report_file',
            'report_url',
            'download_url',
            'created_at',
        ]
        read_only_fields = ['id', 'report_file', 'report_url', 'created_at']

    def get_title(self, obj):
        return f"{obj.resume.title} - {obj.analysis.job_role.title} Report"
