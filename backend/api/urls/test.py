from django.urls import path
from api.views.test import protected_view

urlpatterns = [
    path('protected/', protected_view),
]