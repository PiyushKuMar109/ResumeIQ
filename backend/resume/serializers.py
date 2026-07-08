from rest_framework import serializers
from .models import Resume, ParsedResume, TailoredResume


class ParsedResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParsedResume
        fields = [
            'id', 'name', 'email', 'phone', 'linkedin', 'github', 'portfolio',
            'skills', 'education', 'experience', 'projects', 'certifications', 'languages',
        ]
        read_only_fields = fields


class ResumeSerializer(serializers.ModelSerializer):
    parsed_data = ParsedResumeSerializer(read_only=True)

    class Meta:
        model = Resume
        fields = [
            'id', 'title', 'file', 'file_url', 'file_type', 'extracted_text',
            'status', 'uploaded_at', 'parsed_data',
        ]
        read_only_fields = [
            'id', 'file_url', 'extracted_text', 'status', 'uploaded_at', 'parsed_data',
        ]


class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['title', 'file']

    def validate_file(self, file):
        allowed = ['application/pdf',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if file.content_type not in allowed:
            raise serializers.ValidationError('Only PDF and DOCX files are supported.')
        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('File size must be 5MB or smaller.')
        return file


class TailoredResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TailoredResume
        fields = [
            'id', 'original_resume', 'job_title', 'job_description',
            'summary', 'experience', 'projects', 'skills', 'match_score',
            'suggestions', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TailoredResumeCreateSerializer(serializers.Serializer):
    job_title = serializers.CharField(max_length=255)
    job_description = serializers.CharField()


class CoverLetterRequestSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField()
    job_title = serializers.CharField(max_length=255)
    company_name = serializers.CharField(max_length=255)
    job_description = serializers.CharField(required=False, allow_blank=True)


