from django.urls import path
from .views import DashboardSummaryView, AdminDashboardSummaryView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('admin/summary/', AdminDashboardSummaryView.as_view(), name='dashboard_admin_summary'),
]
