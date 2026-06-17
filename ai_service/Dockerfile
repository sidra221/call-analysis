FROM python:3.11-slim

WORKDIR /app

# Use Google DNS to avoid resolution failures during build
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf || true

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 -r requirements.txt \
    && python -c "import nltk; nltk.download('vader_lexicon')"

COPY . .

EXPOSE 9000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]
