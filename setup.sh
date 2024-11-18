#!/bin/bash

# Function to load environment variables from a file
load_env() {
    local env_file=$1
    if [ -f "$env_file" ]; then
        echo "Loading environment variables from $env_file file..."
        export $(grep -E '^(DATABASE_URL|FILES_PATH|LOGS_PATH)=' "$env_file" | xargs)
    else
        echo "$env_file file not found."
    fi
}

# Load environment variables from .env and .env.test files
load_env .env
load_env .env.test

# Define the app user
APP_USER="appuser" # replace this with the actual user under which your app runs

# Check if environment variables were set
if [[ -z "$DATABASE_URL" || -z "$FILES_PATH" || -z "$LOGS_PATH" ]]; then
    echo "One or more required environment variables (DATABASE_URL, FILES_PATH, LOGS_PATH) are missing in the environment files."
    exit 1
fi

# Extract the directory path from DATABASE_URL (removing the filename)
# Remove 'file:' prefix from DATABASE_URL
DB_PATH_NO_PREFIX=$(echo "$DATABASE_URL" | sed 's/^file://')
DB_DIR=$(dirname "$DB_PATH_NO_PREFIX")

# Create directories
echo "Creating directories..."
sudo mkdir -p "$DB_DIR"
sudo mkdir -p "$FILES_PATH"
sudo mkdir -p "$FILES_PATH/avatars" "$FILES_PATH/attachments"
sudo mkdir -p "$LOGS_PATH"

# Set permissions
echo "Setting permissions..."
sudo chown -R "$APP_USER":"$APP_USER" "$DB_DIR"
sudo chown -R "$APP_USER":"$APP_USER" "$FILES_PATH"
sudo chown -R "$APP_USER":"$APP_USER" "$FILES_PATH/avatars"
sudo chown -R "$APP_USER":"$APP_USER" "$FILES_PATH/attachments"
sudo chown -R "$APP_USER":"$APP_USER" "$LOGS_PATH"

# Verify
echo "Directory setup completed."
echo "Database path (directory only): $DB_DIR"
echo "File storage path: $FILES_PATH"
echo "Logs path: $LOGS_PATH"