from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.lessons.models import Exercise, UserProgress

from .serializers import PronunciationRequestSerializer, PronunciationResponseSerializer
from .services import pronunciation_assessor


class PronunciationAssessmentView(APIView):
    """
    Endpoint for pronunciation assessment.

    POST: Submit audio for pronunciation assessment
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Validate request
        serializer = PronunciationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get assessment from Azure (or mock)
        result = pronunciation_assessor.assess(
            audio_base64=serializer.validated_data['audio'],
            reference_text=serializer.validated_data['reference_text'],
            language=serializer.validated_data.get('language', 'en-US'),
        )

        # Update user progress if exercise_id provided
        exercise_id = serializer.validated_data.get('exercise_id')
        if exercise_id:
            self._update_progress(
                user=request.user,
                exercise_id=exercise_id,
                score=result['pronunciation_score'],
            )

        # Return response
        response_serializer = PronunciationResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def _update_progress(self, user, exercise_id: int, score: float):
        """Update user progress for the exercise."""
        try:
            exercise = Exercise.objects.get(id=exercise_id)
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                exercise=exercise,
                defaults={'best_score': score, 'attempts': 1},
            )

            if not created:
                progress.attempts += 1
                if score > progress.best_score:
                    progress.best_score = score
                if score >= 80:
                    progress.completed = True
                progress.save()

        except Exercise.DoesNotExist:
            pass
