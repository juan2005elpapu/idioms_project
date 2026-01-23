from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import Exercise, Lesson, UserProgress


class ExerciseInline(TabularInline):
    """Inline para crear ejercicios dentro de una lección."""

    model = Exercise
    extra = 1
    fields = ['title', 'text_to_read', 'order']


@admin.register(Lesson)
class LessonAdmin(ModelAdmin):
    list_display = ['title', 'level', 'language', 'order', 'is_active', 'exercise_count']
    list_filter = ['level', 'language', 'is_active']
    search_fields = ['title', 'description']
    inlines = [ExerciseInline]
    fieldsets = (
        (
            None,
            {
                'fields': (
                    'title',
                    'description',
                    'level',
                    'language',
                    'order',
                    'is_active',
                ),
            },
        ),
    )

    def exercise_count(self, obj):
        return obj.exercises.count()

    exercise_count.short_description = 'Exercises'


@admin.register(Exercise)
class ExerciseAdmin(ModelAdmin):
    list_display = ['title', 'lesson', 'order']
    list_filter = ['lesson', 'lesson__level']
    search_fields = ['title', 'text_to_read']


@admin.register(UserProgress)
class UserProgressAdmin(ModelAdmin):
    list_display = ['user', 'exercise', 'best_score', 'attempts', 'completed']
    list_filter = ['completed', 'exercise__lesson']
    search_fields = ['user__email', 'exercise__title']
