"""
Azure Speech Service integration for pronunciation assessment.
"""

import base64
import binascii
import json
import os
import shutil
import subprocess
from typing import Any

import azure.cognitiveservices.speech as speechsdk
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from openai import OpenAI


class SpeechEvaluationError(Exception):
    """Raised when pronunciation assessment cannot be completed."""


class PronunciationAssessor:
    """
    Service for assessing pronunciation using Azure Speech SDK.
    """

    def __init__(self):
        self._openai_client = None

    @property
    def speech_key(self):
        return os.environ.get('AZURE_SPEECH_KEY') or getattr(settings, 'AZURE_SPEECH_KEY', '')

    @property
    def speech_region(self):
        return os.environ.get('AZURE_SPEECH_REGION') or getattr(settings, 'AZURE_SPEECH_REGION', '')

    @property
    def openai_api_key(self):
        return os.environ.get('OPENAI_API_KEY') or getattr(settings, 'OPENAI_API_KEY', '')

    @property
    def openai_client(self):
        if self._openai_client is None and self.openai_api_key:
            self._openai_client = OpenAI(api_key=self.openai_api_key)
        return self._openai_client

    # Public API
    def assess(self, audio_base64: str, reference_text: str, language: str = 'en-US') -> dict:
        if not self.speech_key or not self.speech_region:
            raise ImproperlyConfigured(
                'AZURE_SPEECH_KEY y/o AZURE_SPEECH_REGION no están configuradas.'
            )

        audio_bytes = self._decode_audio(audio_base64)
        # Convertir a WAV PCM mono 16k si viene en webm/opus
        wav_bytes = self._to_wav_pcm16(audio_bytes)

        speech_config = speechsdk.SpeechConfig(
            subscription=self.speech_key,
            region=self.speech_region,
        )
        speech_config.speech_recognition_language = language or 'en-US'

        # Audio desde bytes (base64)
        push_stream = speechsdk.audio.PushAudioInputStream()
        push_stream.write(wav_bytes)
        push_stream.close()
        audio_config = speechsdk.audio.AudioConfig(stream=push_stream)

        # Config de pronunciación
        pron_config = speechsdk.PronunciationAssessmentConfig(
            reference_text=reference_text,
            grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
            granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
            enable_miscue=True,
        )
        recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            audio_config=audio_config,
        )
        pron_config.apply_to(recognizer)

        try:
            result = recognizer.recognize_once_async().get()
        except Exception as exc:  # noqa: BLE001
            raise SpeechEvaluationError('No se pudo comunicar con Azure Speech.') from exc

        if result.reason != speechsdk.ResultReason.RecognizedSpeech:
            details = (
                result.cancellation_details.error_details
                if result.reason == speechsdk.ResultReason.Canceled
                else 'Reconocimiento fallido.'
            )
            raise SpeechEvaluationError(details or 'No se pudo reconocer el audio.')

        json_result = result.properties.get(speechsdk.PropertyId.SpeechServiceResponse_JsonResult)
        if not json_result:
            raise SpeechEvaluationError('Azure no devolvió resultados de reconocimiento.')

        return self._parse_result(json_result, reference_text, language)

    def synthesize_speech(
        self, text: str, voice: str = 'alloy', language: str = 'en-US'
    ) -> dict[str, str]:
        if not self.openai_client:
            raise SpeechEvaluationError('OPENAI_API_KEY no está configurada.')

        response = self.openai_client.audio.speech.create(
            model='gpt-4o-mini-tts',
            voice=voice,
            input=text,
        )

        audio_bytes = response.content if hasattr(response, 'content') else response.read()
        return {'audio': base64.b64encode(audio_bytes).decode('utf-8')}

    def generate_free_practice(
        self,
        topic: str,
        language: str = 'en-US',
        level: str = 'beginner',
        count: int = 6,
        focus: str = '',
    ) -> dict[str, list[str]]:
        if not self.openai_client:
            raise SpeechEvaluationError('OPENAI_API_KEY no está configurada.')

        focus_text = f'Focus: {focus}.' if focus else ''
        system_msg = (
            'You generate short language-learning practice sentences. '
            'Return only JSON array of strings. No extra text.'
        )
        user_msg = (
            f'Language: {language}. Level: {level}. Topic: {topic}. {focus_text} '
            f'Generate {count} short sentences for pronunciation practice.'
        )

        response = self.openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_msg},
                {'role': 'user', 'content': user_msg},
            ],
            temperature=0.7,
        )

        content = response.choices[0].message.content.strip()
        try:
            phrases = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: split lines
            phrases = [line.strip('- ').strip() for line in content.splitlines() if line.strip()]

        if not isinstance(phrases, list):
            raise SpeechEvaluationError('La IA no devolvió una lista válida de frases.')

        return {'phrases': phrases[:count]}

    # Helpers
    def _decode_audio(self, audio_base64: str) -> bytes:
        """Limpia encabezado data: y decodifica base64."""
        if ',' in audio_base64:
            audio_base64 = audio_base64.split(',', 1)[1]
        try:
            return base64.b64decode(audio_base64)
        except binascii.Error as exc:
            raise SpeechEvaluationError('Audio inválido: base64 corrupto.') from exc

    def _parse_result(self, raw_json: str, reference_text: str, language: str) -> dict[str, Any]:
        payload = json.loads(raw_json)
        nbest = payload.get('NBest') or []
        if not nbest:
            raise SpeechEvaluationError('Azure no devolvió alternativas de reconocimiento.')

        top = nbest[0]
        pa = top.get('PronunciationAssessment', {}) or {}
        words_raw = top.get('Words', []) or []

        words, suggestions = self._extract_words(words_raw)

        return {
            'recognition_status': payload.get('RecognitionStatus'),
            'display_text': top.get('Display') or reference_text,
            'confidence': top.get('Confidence'),
            'pronunciation_score': round(pa.get('PronScore', 0.0), 2),
            'accuracy_score': round(pa.get('AccuracyScore', 0.0), 2),
            'fluency_score': round(pa.get('FluencyScore', 0.0), 2),
            'completeness_score': round(pa.get('CompletenessScore', 0.0), 2),
            'words': words,
            'suggestions': suggestions,
        }

    def _extract_words(
        self, words_payload: list[dict[str, Any]]
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        hints: list[dict[str, Any]] = []
        processed: list[dict[str, Any]] = []

        for item in words_payload:
            pa = item.get('PronunciationAssessment', {}) or {}
            accuracy = round(pa.get('AccuracyScore', 0.0), 2)
            error_type = pa.get('ErrorType', 'None')
            word_entry = {
                'word': item.get('Word'),
                'accuracy_score': accuracy,
                'error_type': error_type,
                'offset': item.get('Offset'),
                'duration': item.get('Duration'),
            }
            processed.append(word_entry)

            if accuracy < 90 or error_type != 'None':
                hints.append(
                    {
                        'word': word_entry['word'],
                        'accuracy_score': word_entry['accuracy_score'],
                        'error_type': error_type,
                        'hint': self._hint_for(error_type, word_entry['word']),
                    }
                )
        return processed, hints

    def _hint_for(self, error_type: str, word: str) -> str:
        templates = {
            'Substitution': f"Revisa la vocal/consonante en '{word}'; estás sustituyendo el sonido.",
            'Omission': f"No omitas sonidos en '{word}'; articula cada sílaba.",
            'Insertion': f"Evita añadir sonidos extra en '{word}'; manténlo limpio.",
            'Stress': f"Ajusta el acento en '{word}'; practica la sílaba tónica.",
            'None': f"Repite '{word}' cuidando entonación y ritmo.",
        }
        return templates.get(error_type, templates['None'])

    def _to_wav_pcm16(self, audio_bytes: bytes) -> bytes:
        """Convierte webm/opus a wav PCM 16k mono usando ffmpeg."""
        ffmpeg_bin = shutil.which('ffmpeg')
        if not ffmpeg_bin:
            raise SpeechEvaluationError('ffmpeg no está en PATH; instálalo y agrega su binario.')

        cmd = [
            ffmpeg_bin,
            '-i',
            'pipe:0',  # entrada stdin
            '-ar',
            '16000',  # sample rate
            '-ac',
            '1',  # mono
            '-f',
            'wav',  # formato salida
            'pipe:1',  # stdout
        ]
        try:
            proc = subprocess.run(
                cmd,
                input=audio_bytes,
                capture_output=True,
                check=True,
            )
            return proc.stdout
        except subprocess.CalledProcessError as exc:
            raise SpeechEvaluationError(
                f'ffmpeg falló al convertir audio: {exc.stderr.decode(errors="ignore")}'
            ) from exc


# Singleton instance
pronunciation_assessor = PronunciationAssessor()
