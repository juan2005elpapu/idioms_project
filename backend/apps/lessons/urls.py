from django.urls import path

from .views import (
    ExerciseDetailView,
    LessonDetailView,
    LessonListView,
    UserProgressDetailView,
    UserProgressListView,
)

urlpatterns = [
    # Lessons
    path('', LessonListView.as_view(), name='lesson-list'),
    path('<int:pk>/', LessonDetailView.as_view(), name='lesson-detail'),
    # Exercises
    path('exercises/<int:pk>/', ExerciseDetailView.as_view(), name='exercise-detail'),
    # User Progress
    path('progress/', UserProgressListView.as_view(), name='progress-list'),
    path('progress/<int:pk>/', UserProgressDetailView.as_view(), name='progress-detail'),
]
