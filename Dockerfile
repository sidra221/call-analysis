# Base image with Python 3.11
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies with retry on timeout
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 -r requirements.txt

# Copy application source code
COPY . .

# Expose the Django port
EXPOSE 8000

# Default command — overridden by docker-compose per service
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]