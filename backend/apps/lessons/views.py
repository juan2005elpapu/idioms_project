from rest_framework import generics, permissions

from .models import Exercise, Lesson, UserProgress
from .serializers import (
    ExerciseSerializer,
    LessonDetailSerializer,
    LessonListSerializer,
    UserProgressSerializer,
)


class LessonListView(generics.ListAPIView):
    """List all active lessons."""

    queryset = Lesson.objects.filter(is_active=True)
    serializer_class = LessonListSerializer
    permission_classes = [permissions.IsAuthenticated]


class LessonDetailView(generics.RetrieveAPIView):
    """Get a single lesson with its exercises."""

    queryset = Lesson.objects.filter(is_active=True)
    serializer_class = LessonDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class ExerciseDetailView(generics.RetrieveAPIView):
    """Get a single exercise."""

    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserProgressListView(generics.ListAPIView):
    """List user's progress on all exercises."""

    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)


class UserProgressDetailView(generics.RetrieveUpdateAPIView):
    """Get or update progress for a specific exercise."""

    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)
