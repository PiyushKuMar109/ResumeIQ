from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class JobRole(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    required_skills = models.JSONField(default=list, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    experience_level = models.CharField(max_length=100, default='Fresher', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class JobRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_recommendations')
    resume = models.ForeignKey('resume.Resume', on_delete=models.CASCADE, related_name='job_recommendations')
    job_title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    match_percentage = models.FloatField(default=0)
    required_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.job_title} recommendation for {self.user.email}"


class JobApplication(models.Model):
    STAGE_BOOKMARKED = 'BOOKMARKED'
    STAGE_APPLIED = 'APPLIED'
    STAGE_INTERVIEWING = 'INTERVIEWING'
    STAGE_OFFER = 'OFFER'
    STAGE_REJECTED = 'REJECTED'
    
    STAGE_CHOICES = [
        (STAGE_BOOKMARKED, 'Bookmarked'),
        (STAGE_APPLIED, 'Applied'),
        (STAGE_INTERVIEWING, 'Interviewing'),
        (STAGE_OFFER, 'Offer'),
        (STAGE_REJECTED, 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_applications')
    job_title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    stage = models.CharField(max_length=50, choices=STAGE_CHOICES, default=STAGE_BOOKMARKED)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.job_title} at {self.company_name} - {self.stage}"
