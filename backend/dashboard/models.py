from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ('UPLOAD_COMPLETE', 'Upload Complete'),
        ('ANALYSIS_COMPLETE', 'Analysis Complete'),
        ('REPORT_GENERATED', 'Report Generated'),
        ('ERROR', 'Error'),
        ('PROFILE_UPDATED', 'Profile Updated'),
        ('JOB_RECOMMENDATION', 'Job Recommendation'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} - {self.user.email}"
