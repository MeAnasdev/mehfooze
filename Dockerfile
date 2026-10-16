# Mehfooze — Backend API
# Railway builds from the repo root using this file.
# The FastAPI app lives in the app/ subdirectory.

FROM python:3.12-slim

# System deps for psycopg2 (PostgreSQL driver) and Prophet/pystan
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# Install Python dependencies (cached layer)
COPY app/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the entire backend app
COPY app/ ./app/

# Railway injects PORT automatically
ENV PORT=8000
EXPOSE 8000

# Use shell form so $PORT is expanded at runtime
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"
