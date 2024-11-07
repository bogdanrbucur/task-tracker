#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -E '^(DATABASE_URL|FILES_PATH|LOGS_PATH)=' .env | xargs)
else
    echo ".env file not found. Exiting."
    exit 1
fi

# Define the app user
APP_USER="appuser" # replace this with the actual user under which your app runs

# Check if environment variables were set
if [[ -z "$DATABASE_URL" || -z "$FILES_PATH" || -z "$LOGS_PATH" ]]; then
    echo "One or more required environment variables (DATABASE_URL, FILES_PATH, LOGS_PATH) are missing in the .env file."
    exit 1
fi

# Extract the directory path from DATABASE_URL (removing the filename)
DB_DIR=$(dirname "$DATABASE_URL")

# Create directories
echo "Creating directories..."
sudo mkdir -p "$DB_DIR"
sudo mkdir -p "$FILES_PATH"
sudo mkdir -p "$LOGS_PATH"

# Set permissions
echo "Setting permissions..."
sudo chown -R "$APP_USER":"$APP_USER" "$DB_DIR"
sudo chown -R "$APP_USER":"$APP_USER" "$FILES_PATH"
sudo chown -R "$APP_USER":"$APP_USER" "$LOGS_PATH"

# Verify
echo "Directory setup completed."
echo "Database path (directory only): $DB_DIR"
echo "File storage path: $FILES_PATH"
echo "Logs path: $LOGS_PATH"
