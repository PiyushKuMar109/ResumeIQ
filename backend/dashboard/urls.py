from django.urls import path
from .views import (
    DashboardSummaryView,
    AdminDashboardSummaryView,
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationDeleteView,
)

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('admin/summary/', AdminDashboardSummaryView.as_view(), name='dashboard_admin_summary'),
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/mark-read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('notifications/mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('notifications/<int:pk>/delete/', NotificationDeleteView.as_view(), name='notification_delete'),
]
