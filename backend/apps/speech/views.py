from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.lessons.models import Exercise, UserProgress

from .serializers import (
    FreePracticeAssessmentRequestSerializer,
    FreePracticeRequestSerializer,
    FreePracticeResponseSerializer,
    PronunciationRequestSerializer,
    PronunciationResponseSerializer,
    TextToSpeechRequestSerializer,
    TextToSpeechResponseSerializer,
)
from .services import SpeechEvaluationError, pronunciation_assessor


class PronunciationAssessmentView(APIView):
    """
    Endpoint for pronunciation assessment.

    POST: Submit audio for pronunciation assessment
    """

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['post']  # solo POST

    def post(self, request):
        # Validate request
        serializer = PronunciationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Get assessment from Azure (or mock)
            result = pronunciation_assessor.assess(
                audio_base64=serializer.validated_data['audio'],
                reference_text=serializer.validated_data['reference_text'],
                language=serializer.validated_data.get('language', 'en-US'),
            )
        except SpeechEvaluationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

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


class TextToSpeechView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['post']

    def post(self, request):
        serializer = TextToSpeechRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = pronunciation_assessor.synthesize_speech(
                text=serializer.validated_data['text'],
                voice=serializer.validated_data['voice'],
                language=serializer.validated_data.get('language', 'en-US'),
            )
        except SpeechEvaluationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = TextToSpeechResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class FreePracticeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['post']

    def post(self, request):
        serializer = FreePracticeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = pronunciation_assessor.generate_free_practice(
                topic=serializer.validated_data['topic'],
                language=serializer.validated_data.get('language', 'en-US'),
                level=serializer.validated_data.get('level', 'beginner'),
                count=serializer.validated_data.get('count', 6),
                focus=serializer.validated_data.get('focus', ''),
            )
        except SpeechEvaluationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = FreePracticeResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class FreePracticeAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['post']

    def post(self, request):
        serializer = FreePracticeAssessmentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = pronunciation_assessor.assess(
                audio_base64=serializer.validated_data['audio'],
                reference_text=serializer.validated_data['reference_text'],
                language=serializer.validated_data.get('language', 'en-US'),
            )
        except SpeechEvaluationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = PronunciationResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
