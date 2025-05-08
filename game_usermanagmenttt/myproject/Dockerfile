# Use the official Python image from the Docker Hub
# Use the official Python image from the Docker Hub
FROM python:3.10-slim

# Set environment variable for Django settings module
ENV DJANGO_SETTINGS_MODULE=myproject.settings

# Set the working directory in the container
WORKDIR /app

# Install build dependencies and other required packages
RUN apt-get update && \
    apt-get install -y gcc libyaml-dev build-essential netcat-openbsd --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Upgrade pip and install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the content of the local directory to the working directory
COPY . .

# Expose the ports the app runs on
EXPOSE 8000
