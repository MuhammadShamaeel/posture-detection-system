from rest_framework import serializers
from db.models.session import Session

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = "__all__"
        read_only_fields = ["user", "created_at"]