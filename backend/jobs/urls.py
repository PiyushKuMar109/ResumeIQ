from django.urls import path
from .views import (
    JobRoleListCreateView,
    JobRoleDetailView,
    JobRecommendView,
    JobApplicationListCreateView,
    JobApplicationDetailView,
)

urlpatterns = [
    path('roles/', JobRoleListCreateView.as_view(), name='job_role_list_create'),
    path('roles/<int:pk>/', JobRoleDetailView.as_view(), name='job_role_detail'),
    path('recommend/', JobRecommendView.as_view(), name='job_recommend'),
    path('applications/', JobApplicationListCreateView.as_view(), name='job_applications_list_create'),
    path('applications/<int:pk>/', JobApplicationDetailView.as_view(), name='job_application_detail'),
]
