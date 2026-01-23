from django.conf import settings
from django.db import models

LANGUAGE_CHOICES = [
    ('en-US', 'English (US)'),
    ('pt-BR', 'Português (Brasil)'),
    ('fr-FR', 'Français'),
    ('ru-RU', 'Русский'),
    ('de-DE', 'Deutsch'),
    ('it-IT', 'Italiano'),
    ('zh-CN', '中文 (普通话)'),
]


class Lesson(models.Model):
    """A lesson containing multiple exercises."""

    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en-US')
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.title


class Exercise(models.Model):
    """An exercise for pronunciation practice."""

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='exercises',
    )
    title = models.CharField(max_length=200)
    text_to_read = models.TextField(help_text='The text the user should pronounce')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f'{self.lesson.title} - {self.title}'


class UserProgress(models.Model):
    """Track user progress on exercises."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress',
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE,
        related_name='user_progress',
    )
    best_score = models.FloatField(default=0)
    attempts = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    last_attempt_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'exercise']

    def __str__(self):
        return f'{self.user.email} - {self.exercise.title}: {self.best_score}%'
