# Use a stable base image
FROM python:3.12-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies (force break-system-packages for Python 3.12)
RUN pip install --no-cache-dir --break-system-packages -i https://pypi.org/simple -r requirements.txt

COPY . .

CMD ["python", "backend/manage.py", "runserver", "0.0.0.0:8000"]
