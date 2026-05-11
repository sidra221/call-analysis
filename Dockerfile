# Use a stable base image (bullseye instead of trixie)
FROM python:3.12-slim-bullseye

# Set working directory inside the container
WORKDIR /app

# Install system dependencies (needed for psycopg2 and PostgreSQL support)
RUN apt-get -o Acquire::ForceIPv4=true update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files into the container
COPY . .

# Default command for development (can be overridden in docker-compose)
CMD ["python", "call_analysis/manage.py", "runserver", "0.0.0.0:8000"]
