FROM python:3.13-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY config.py main.py ./
COPY api/ ./api/
COPY kg/ ./kg/
COPY prompts/ ./prompts/
COPY ingest/ ./ingest/

# Copy pre-built data
COPY data/ ./data/
COPY db ./db

EXPOSE 8000
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
