from django.urls import path

from .views import PronunciationAssessmentView

urlpatterns = [
    path('assess/', PronunciationAssessmentView.as_view(), name='pronunciation-assess'),
]
