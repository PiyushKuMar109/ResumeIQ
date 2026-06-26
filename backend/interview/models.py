from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class InterviewQuestion(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('TECHNICAL', 'Technical'),
        ('HR', 'HR'),
        ('PROJECT', 'Project'),
        ('CODING', 'Coding'),
    ]

    DIFFICULTY_CHOICES = [
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interview_questions')
    resume = models.ForeignKey('resume.Resume', on_delete=models.CASCADE, related_name='interview_questions')
    job_role = models.ForeignKey('jobs.JobRole', on_delete=models.CASCADE, related_name='interview_questions')
    question = models.TextField()
    answer_hint = models.TextField(blank=True)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.question_type} question for {self.job_role.title}"
