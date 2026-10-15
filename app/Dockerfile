FROM python:3.12-slim

# Install system dependencies for psycopg2 and prophet/pystan compilation
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# Copy and install Python dependencies first (layer-caching for faster rebuilds)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application source
COPY . .

# Railway injects PORT as an environment variable — we read it at runtime
# Default to 8000 for local Docker usage
ENV PORT=8000
EXPOSE $PORT

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
