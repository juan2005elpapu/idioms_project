from django.urls import path

from .views import PronunciationAssessmentView, TextToSpeechView

urlpatterns = [
    path('assess/', PronunciationAssessmentView.as_view(), name='pronunciation-assess'),
    path('tts/', TextToSpeechView.as_view(), name='speech-tts'),
]
