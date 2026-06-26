from django.urls import path
from .views import (
    AnalysisCreateView,
    AnalysisDetailView,
    AnalysisByResumeView,
    AnalysisHistoryView,
)

urlpatterns = [
    path('analyze/', AnalysisCreateView.as_view(), name='analysis_create'),
    path('<int:pk>/', AnalysisDetailView.as_view(), name='analysis_detail'),
    path('resume/<int:resume_id>/', AnalysisByResumeView.as_view(), name='analysis_by_resume'),
    path('history/', AnalysisHistoryView.as_view(), name='analysis_history'),
]
