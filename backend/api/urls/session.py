from django.urls import path
from api.views.session import (
    create_session,
    get_sessions,
    delete_session,
    clear_sessions,
    predict_posture,
    batch_predict_posture,
    model_health,  # NEW
)

urlpatterns = [
    path("", get_sessions),
    path("create/", create_session),
    path("predict/", predict_posture),
    path("batch-predict/", batch_predict_posture),
    path("health/", model_health),  # NEW: Check if model is loaded
    path("<int:session_id>/delete/", delete_session),
    path("clear/", clear_sessions),
]