# Base image with Python 3.11
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required by WhisperX and audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose the port FastAPI will run on
EXPOSE 9000

# Start the FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]