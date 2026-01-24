from django.urls import path

from .views import (
    FreePracticeAssessmentView,
    FreePracticeView,
    PronunciationAssessmentView,
    TextToSpeechView,
)

urlpatterns = [
    path('assess/', PronunciationAssessmentView.as_view(), name='pronunciation-assess'),
    path('assess-free/', FreePracticeAssessmentView.as_view(), name='speech-assess-free'),
    path('tts/', TextToSpeechView.as_view(), name='speech-tts'),
    path('free-practice/', FreePracticeView.as_view(), name='speech-free-practice'),
]
