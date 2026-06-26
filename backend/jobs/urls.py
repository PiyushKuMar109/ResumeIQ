from django.urls import path
from .views import JobRoleListCreateView, JobRoleDetailView, JobRecommendView

urlpatterns = [
    path('roles/', JobRoleListCreateView.as_view(), name='job_role_list_create'),
    path('roles/<int:pk>/', JobRoleDetailView.as_view(), name='job_role_detail'),
    path('recommend/', JobRecommendView.as_view(), name='job_recommend'),
]
