from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from db.models.session import Session
from api.serializers.session_serializer import SessionSerializer


#  Create session
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_session(request):
    data = request.data.copy()
    data["user"] = request.user.id

    serializer = SessionSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data)

    return Response(serializer.errors, status=400)


#  Get all sessions
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    sessions = Session.objects.filter(user=request.user).order_by("-started_at")
    serializer = SessionSerializer(sessions, many=True)
    return Response(serializer.data)


#  Delete session
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    try:
        session = Session.objects.get(id=session_id, user=request.user)
        session.delete()
        return Response({"message": "Deleted"})
    except Session.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


#  Clear all sessions
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def clear_sessions(request):
    Session.objects.filter(user=request.user).delete()
    return Response({"message": "All sessions cleared"})