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


class MockInterviewSession(models.Model):
    STATUS_STARTED = 'STARTED'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CHOICES = [
        (STATUS_STARTED, 'Started'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mock_sessions')
    resume = models.ForeignKey('resume.Resume', on_delete=models.CASCADE, related_name='mock_sessions')
    job_title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_STARTED)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.id} for {self.user.email} - {self.job_title}"


class MockInterviewQuestionAnswer(models.Model):
    session = models.ForeignKey(MockInterviewSession, on_delete=models.CASCADE, related_name='qa_pairs')
    question_text = models.TextField()
    answer_hint = models.TextField(blank=True)
    question_type = models.CharField(max_length=50, default='TECHNICAL')
    
    # User's response
    user_answer = models.TextField(blank=True, null=True)
    answered_at = models.DateTimeField(blank=True, null=True)
    
    # AI feedback and scores
    score = models.FloatField(default=0.0) # 0 to 100
    feedback = models.TextField(blank=True)
    model_answer = models.TextField(blank=True)

    def __str__(self):
        return f"Q&A {self.id} in Session {self.session.id}"


class InterviewerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='interviewer_profile')
    bio = models.TextField(blank=True)
    company = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=255, blank=True)
    skills = models.CharField(max_length=500, blank=True, help_text="Comma-separated skills")
    credit_rate = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interviewer: {self.user.full_name or self.user.email} ({self.company})"


class AvailabilitySlot(models.Model):
    interviewer = models.ForeignKey(InterviewerProfile, on_delete=models.CASCADE, related_name='slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Slot for {self.interviewer.user.email} from {self.start_time} to {self.end_time}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    SESSION_TYPE_CHOICES = [
        ('AI', 'AI Mock Session'),
        ('PEER', 'Peer-to-Peer Interview'),
    ]
    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='candidate_bookings')
    interviewer = models.ForeignKey(InterviewerProfile, on_delete=models.CASCADE, related_name='interviewer_bookings')
    slot = models.ForeignKey(AvailabilitySlot, on_delete=models.SET_NULL, null=True, blank=True, related_name='booking')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    credits_charged = models.IntegerField(default=0)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='PEER')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking {self.id} (Candidate: {self.candidate.email} -> Interviewer: {self.interviewer.user.email})"


class CreditTransaction(models.Model):
    TYPE_CHOICES = [
        ('AI_INTERVIEW', 'AI Mock Interview'),
        ('PEER_BOOKING', 'Peer booking fee'),
        ('PEER_EARNING', 'Peer slot earning'),
        ('CREDIT_ADD', 'Initial/Refund/Purchase credits'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credit_transactions')
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=25, choices=TYPE_CHOICES, default='PEER_BOOKING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Tx {self.id} for {self.user.email}: {self.amount} ({self.transaction_type})"


