FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001 \
    VECTOR_STORE_PATH=/app/vision/vector_store/face_vectors.json \
    ATTENDANCE_DB_PATH=/app/vision/vector_store/attendance.db

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Ensure vector store directory exists
RUN mkdir -p /app/vision/vector_store

EXPOSE 8001

CMD ["sh", "-c", "uvicorn vision.app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
