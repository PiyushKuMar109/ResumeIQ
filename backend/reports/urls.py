from django.urls import path
from .views import ReportGenerateView, ReportListView, ReportDownloadView

urlpatterns = [
    path('generate/', ReportGenerateView.as_view(), name='report_generate'),
    path('', ReportListView.as_view(), name='report_list'),
    path('<int:pk>/download/', ReportDownloadView.as_view(), name='report_download'),
]
