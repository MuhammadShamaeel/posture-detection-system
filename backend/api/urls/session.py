from django.urls import path
from api.views.session import (
    create_session,
    get_sessions,
    delete_session,
    clear_sessions,
)

urlpatterns = [
    path("", get_sessions),
    path("create/", create_session),
    path("<int:session_id>/delete/", delete_session),
    path("clear/", clear_sessions),
]