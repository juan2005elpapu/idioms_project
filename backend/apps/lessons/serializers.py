from rest_framework import serializers

from .models import Exercise, Lesson, UserProgress


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'title', 'text_to_read', 'order']


class LessonListSerializer(serializers.ModelSerializer):
    exercise_count = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'level', 'language', 'exercise_count']

    def get_exercise_count(self, obj):
        return obj.exercises.count()


class LessonDetailSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'level', 'language', 'exercises']


class UserProgressSerializer(serializers.ModelSerializer):
    exercise_title = serializers.CharField(source='exercise.title', read_only=True)
    lesson_title = serializers.CharField(source='exercise.lesson.title', read_only=True)

    class Meta:
        model = UserProgress
        fields = [
            'id',
            'exercise',
            'exercise_title',
            'lesson_title',
            'best_score',
            'attempts',
            'completed',
            'last_attempt_at',
        ]
