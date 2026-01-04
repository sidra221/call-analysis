FROM python:3.12-slim

# Set work directory inside the container
WORKDIR /app

# Install system dependencies (important for psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Command for development (we will override it in docker-compose)
CMD ["python", "backend/manage.py", "runserver", "0.0.0.0:8000"]
