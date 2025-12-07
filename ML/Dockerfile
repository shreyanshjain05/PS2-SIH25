# Use official Python slim image consistently
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# gcc and python3-dev might be needed for some python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv

# Enable virtual environment by adding it to PATH
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements first to leverage cache
COPY requirements.txt .

# Install python dependencies in the virtual environment
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the server using the virtual environment's python
CMD ["python", "server.py"]