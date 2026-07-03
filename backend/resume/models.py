from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Resume(models.Model):
    STATUS_UPLOADED = 'UPLOADED'
    STATUS_PROCESSED = 'PROCESSED'
    STATUS_FAILED = 'FAILED'

    STATUS_CHOICES = [
        (STATUS_UPLOADED, 'Uploaded'),
        (STATUS_PROCESSED, 'Processed'),
        (STATUS_FAILED, 'Failed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='resumes/')
    file_url = models.URLField(max_length=1000, blank=True, null=True)
    file_type = models.CharField(max_length=20)
    extracted_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPLOADED)

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class ParsedResume(models.Model):
    resume = models.OneToOneField(Resume, on_delete=models.CASCADE, related_name='parsed_data')
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True)
    linkedin = models.URLField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)
    portfolio = models.URLField(blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)
    projects = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Parsed Resume for {self.resume.title}"


class TailoredResume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tailored_resumes')
    original_resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='tailored_versions')
    job_title = models.CharField(max_length=255)
    job_description = models.TextField()
    
    # AI Tailored content
    summary = models.TextField(blank=True)
    experience = models.JSONField(default=list, blank=True) # list of {"original": str, "tailored": str, "reason": str}
    projects = models.JSONField(default=list, blank=True)   # list of {"original": str, "tailored": str, "reason": str}
    skills = models.JSONField(default=list, blank=True)     # list of strings (matched/suggested skills)
    
    # Overall feedback & metrics
    match_score = models.FloatField(default=0.0)
    suggestions = models.JSONField(default=list, blank=True) # list of strings (overall tips)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Tailored for {self.job_title} - {self.original_resume.title}"

