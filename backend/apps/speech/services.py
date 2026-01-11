"""
Azure Speech Service integration for pronunciation assessment.
"""

import os

# Azure SDK - se usará cuando tengamos la API key
# import azure.cognitiveservices.speech as speechsdk


class PronunciationAssessor:
    """
    Service for assessing pronunciation using Azure Speech SDK.

    Returns mock data when AZURE_SPEECH_KEY is not configured.
    """

    def __init__(self):
        self.speech_key = os.environ.get('AZURE_SPEECH_KEY', '')
        self.speech_region = os.environ.get('AZURE_SPEECH_REGION', 'eastus')

    def assess(self, audio_base64: str, reference_text: str, language: str = 'en-US') -> dict:
        """
        Assess pronunciation of audio against reference text.

        Args:
            audio_base64: Base64 encoded audio (WAV format recommended)
            reference_text: The text that should be pronounced
            language: Language code (e.g., 'en-US', 'es-ES')

        Returns:
            Dictionary with pronunciation scores
        """
        if not self.speech_key:
            # Return mock data for development
            return self._get_mock_assessment(reference_text)

        # TODO: Implement real Azure Speech API call
        return self._get_mock_assessment(reference_text)

    def _get_mock_assessment(self, reference_text: str) -> dict:
        """Return mock assessment data for development."""
        import random

        words = reference_text.split()
        word_scores = []

        for word in words:
            word_score = random.randint(70, 100)
            word_scores.append(
                {
                    'word': word,
                    'accuracy_score': word_score,
                    'error_type': 'None' if word_score >= 80 else 'Mispronunciation',
                }
            )

        overall_score = sum(w['accuracy_score'] for w in word_scores) / len(word_scores)

        return {
            'recognition_status': 'Success',
            'pronunciation_score': round(overall_score, 1),
            'accuracy_score': round(overall_score + random.uniform(-5, 5), 1),
            'fluency_score': round(random.uniform(70, 95), 1),
            'completeness_score': 100.0,
            'words': word_scores,
        }


# Singleton instance
pronunciation_assessor = PronunciationAssessor()
