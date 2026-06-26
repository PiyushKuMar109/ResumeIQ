from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Report(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    resume = models.ForeignKey('resume.Resume', on_delete=models.CASCADE, related_name='reports')
    analysis = models.ForeignKey('analysis.ResumeAnalysis', on_delete=models.CASCADE, related_name='reports')
    report_file = models.FileField(upload_to='reports/')
    report_url = models.URLField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report {self.pk} for {self.resume.title}"
