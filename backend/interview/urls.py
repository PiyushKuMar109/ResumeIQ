from django.urls import path
from .views import (
    InterviewGenerateView,
    InterviewByResumeView,
    InterviewDetailView,
    MockInterviewSessionListView,
    MockInterviewStartView,
    MockInterviewAnswerView,
    MockInterviewSessionDetailView,
    InterviewerProfileView,
    AvailabilitySlotView,
    BookSlotView,
    UserBookingListView,
    InterviewerDashboardView,
    AddCreditsView,
)

urlpatterns = [
    path('generate/', InterviewGenerateView.as_view(), name='interview_generate'),
    path('resume/<int:resume_id>/', InterviewByResumeView.as_view(), name='interview_by_resume'),
    path('<int:pk>/', InterviewDetailView.as_view(), name='interview_detail'),
    
    # Mock AI Sessions
    path('sessions/', MockInterviewSessionListView.as_view(), name='mock_interview_sessions_list'),
    path('sessions/start/', MockInterviewStartView.as_view(), name='mock_interview_start'),
    path('sessions/<int:pk>/answer/', MockInterviewAnswerView.as_view(), name='mock_interview_answer'),
    path('sessions/<int:pk>/', MockInterviewSessionDetailView.as_view(), name='mock_interview_detail'),
    
    # Interviewers & Peer Bookings
    path('interviewers/', InterviewerProfileView.as_view(), name='interviewer_profile'),
    path('slots/', AvailabilitySlotView.as_view(), name='availability_slots'),
    path('slots/<int:interviewer_id>/', AvailabilitySlotView.as_view(), name='interviewer_slots'),
    path('slots/<int:slot_id>/book/', BookSlotView.as_view(), name='book_slot'),
    path('bookings/', UserBookingListView.as_view(), name='user_bookings'),
    path('dashboard/', InterviewerDashboardView.as_view(), name='interviewer_dashboard'),
    path('credits/add/', AddCreditsView.as_view(), name='add_credits'),
]


