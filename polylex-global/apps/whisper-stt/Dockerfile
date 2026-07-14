FROM python:3.10-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ffmpeg \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

COPY apps/whisper-stt/requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel \
  && python -m pip install torch==2.1.0+cpu torchvision==0.16.0+cpu torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu \
  && python -m pip install --no-cache-dir -r requirements.txt

COPY apps/whisper-stt/app.py .

EXPOSE 9000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]
