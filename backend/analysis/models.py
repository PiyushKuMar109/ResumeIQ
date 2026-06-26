from django.db import models
from django.contrib.auth import get_user_model
from resume.models import Resume
from jobs.models import JobRole

User = get_user_model()


class ResumeAnalysis(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='analyses')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses')
    job_role = models.ForeignKey(JobRole, on_delete=models.CASCADE, related_name='analyses')
    ats_score = models.FloatField(default=0)
    skills_score = models.FloatField(default=0)
    keywords_score = models.FloatField(default=0)
    projects_score = models.FloatField(default=0)
    experience_score = models.FloatField(default=0)
    education_score = models.FloatField(default=0)
    formatting_score = models.FloatField(default=0)
    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    suggestions = models.JSONField(default=list, blank=True)
    job_match_percentage = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analysis {self.pk} for resume {self.resume.title}"
