from django.urls import path
from .views import (
    ResumeUploadView,
    ResumeListView,
    ResumeDetailView,
    ResumeDeleteView,
    ResumeParseView,
    TailoredResumeCreateView,
    TailoredResumeListView,
    TailoredResumeDetailView,
)

urlpatterns = [
    path('upload/', ResumeUploadView.as_view(), name='resume_upload'),
    path('', ResumeListView.as_view(), name='resume_list'),
    path('<int:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('<int:pk>/delete/', ResumeDeleteView.as_view(), name='resume_delete'),
    path('<int:pk>/parse/', ResumeParseView.as_view(), name='resume_parse'),
    path('<int:pk>/tailor/', TailoredResumeCreateView.as_view(), name='resume_tailor'),
    path('tailored/', TailoredResumeListView.as_view(), name='tailored_resume_list'),
    path('tailored/<int:pk>/', TailoredResumeDetailView.as_view(), name='tailored_resume_detail'),
]

