# syntax=docker/dockerfile:1
# Base image with Python 3.11
FROM python:3.11-slim

WORKDIR /app

# Use host network during build so apt/pip can resolve DNS on restricted networks
RUN --network=host apt-get update && apt-get install -y --no-install-recommends \
    -o Acquire::Retries=10 \
    -o Acquire::http::Timeout=120 \
    libpq-dev \
    gcc \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN --network=host pip install --no-cache-dir --timeout=120 --retries=5 -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
