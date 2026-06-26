from django.urls import path
from .views import InterviewGenerateView, InterviewByResumeView, InterviewDetailView

urlpatterns = [
    path('generate/', InterviewGenerateView.as_view(), name='interview_generate'),
    path('resume/<int:resume_id>/', InterviewByResumeView.as_view(), name='interview_by_resume'),
    path('<int:pk>/', InterviewDetailView.as_view(), name='interview_detail'),
]
