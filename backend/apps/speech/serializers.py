from rest_framework import serializers


class PronunciationRequestSerializer(serializers.Serializer):
    """Request for pronunciation assessment."""

    audio = serializers.CharField(help_text='Base64 encoded audio')
    reference_text = serializers.CharField(max_length=1000)
    language = serializers.CharField(max_length=10, default='en-US')
    exercise_id = serializers.IntegerField(required=False, allow_null=True)


class WordScoreSerializer(serializers.Serializer):
    """Score for a single word."""

    word = serializers.CharField()
    accuracy_score = serializers.FloatField()
    error_type = serializers.CharField()


class PronunciationResponseSerializer(serializers.Serializer):
    """Response from pronunciation assessment."""

    recognition_status = serializers.CharField()
    pronunciation_score = serializers.FloatField()
    accuracy_score = serializers.FloatField()
    fluency_score = serializers.FloatField()
    completeness_score = serializers.FloatField()
    words = WordScoreSerializer(many=True)


class TextToSpeechRequestSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000)
    voice = serializers.CharField(max_length=100, default='alloy')
    language = serializers.CharField(max_length=10, default='en-US')


class TextToSpeechResponseSerializer(serializers.Serializer):
    audio = serializers.CharField()


class FreePracticeRequestSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=120)
    language = serializers.CharField(max_length=10, default='en-US')
    level = serializers.CharField(max_length=20, default='beginner')
    count = serializers.IntegerField(min_value=1, max_value=10, default=6)
    focus = serializers.CharField(max_length=120, required=False, allow_blank=True, default='')


class FreePracticeResponseSerializer(serializers.Serializer):
    phrases = serializers.ListField(child=serializers.CharField())


class FreePracticeAssessmentRequestSerializer(serializers.Serializer):
    audio = serializers.CharField()
    reference_text = serializers.CharField()
    language = serializers.CharField(max_length=10, default='en-US')
