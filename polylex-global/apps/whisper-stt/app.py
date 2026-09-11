import base64
import os
import tempfile

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import whisper


class TranscribeRequest(BaseModel):
    audioBase64: str
    languageCode: str | None = None
    audioMimeType: str | None = None


class TranscribeResponse(BaseModel):
    transcript: str
    language: str | None = None
    confidence: float | None = None


def strip_data_uri(data: str) -> str:
    if data.startswith('data:') and ',' in data:
        return data.split(',', 1)[1]
    return data


def get_env(name: str, default: str) -> str:
    return os.getenv(name, default)


def audio_suffix(mime_type: str | None) -> str:
    media_type = (mime_type or '').split(';', 1)[0].lower()
    return {
        'audio/flac': '.flac',
        'audio/mp4': '.m4a',
        'audio/mpeg': '.mp3',
        'audio/ogg': '.ogg',
        'audio/wav': '.wav',
        'audio/x-wav': '.wav',
    }.get(media_type, '.webm')


MODEL_NAME = get_env('WHISPER_MODEL', 'small')
DEVICE = get_env('WHISPER_DEVICE', 'cpu')
USE_FP16 = DEVICE != 'cpu'

app = FastAPI(title='Whisper STT Service')
model = whisper.load_model(MODEL_NAME, device=DEVICE)


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok', 'model': MODEL_NAME, 'device': DEVICE}


@app.post('/transcribe', response_model=TranscribeResponse)
def transcribe(request: TranscribeRequest) -> TranscribeResponse:
    base64_data = strip_data_uri(request.audioBase64)
    if not base64_data:
        raise HTTPException(status_code=400, detail='Empty audio payload')

    try:
        audio_bytes = base64.b64decode(base64_data)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid base64 audio content')

    with tempfile.NamedTemporaryFile(suffix=audio_suffix(request.audioMimeType), delete=False) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name

    try:
        result = model.transcribe(
            tmp_path,
            language=request.languageCode if request.languageCode else None,
            task='transcribe',
            fp16=USE_FP16,
        )
        transcript = result.get('text', '').strip()
        language = result.get('language')
        confidence = None
        segments = result.get('segments') or []
        confidences = [segment.get('avg_logprob') for segment in segments if segment.get('avg_logprob') is not None]
        if confidences:
            confidence = float(sum(confidences) / len(confidences))
        return TranscribeResponse(
            transcript=transcript,
            language=language,
            confidence=confidence,
        )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
