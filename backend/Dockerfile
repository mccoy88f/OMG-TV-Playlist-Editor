FROM python:3.11-slim AS base

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create data directory with correct permissions
RUN mkdir -p /data && chmod 777 /data

# Expose port
EXPOSE 8000

# Run the application
CMD cd /app && uvicorn main:app --host 0.0.0.0 --port 8000 --reload