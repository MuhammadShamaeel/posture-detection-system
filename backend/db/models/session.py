from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Session(models.Model):
    TREND_CHOICES = [
        ("STABLE", "Stable"),
        ("DEGRADING", "Degrading"),
        ("IMPROVING", "Improving"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")

    started_at   = models.DateTimeField()
    ended_at     = models.DateTimeField()
    duration_sec = models.IntegerField()

    calibrated   = models.BooleanField(default=False)
    good_percent = models.FloatField(default=0)
    poor_duration = models.IntegerField(default=0)

    psi   = models.FloatField(default=100)
    trend = models.CharField(max_length=20, choices=TREND_CHOICES, default="STABLE")

    drift_axes = models.JSONField(default=list)  
    alert_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.id} - {self.user}"