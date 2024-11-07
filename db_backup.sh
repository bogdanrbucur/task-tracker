#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -E '^(DATABASE_URL|FILES_PATH)=' .env | xargs)
else
    echo ".env file not found. Exiting."
    exit 1
fi

# Check if environment variables were set
if [[ -z "$DATABASE_URL" || -z "$FILES_PATH" ]]; then
    echo "Required environment variables (DATABASE_URL, FILES_PATH) are missing in the .env file."
    exit 1
fi

# Get current date and time in the format YYYY-MM-DD_HH-MM-SS
current_datetime=$(date +'%Y-%m-%d_%H-%M-%S')

# Define the backup filename with the current date and time
backup_filename="backup-${current_datetime}.tar.gz"

# Define the correct database path and a temporary backup path
db_backup_path="$(dirname "$DATABASE_URL")/backup-${current_datetime}.db"

# Perform a safe SQLite backup using the .backup command
sqlite3 "$DATABASE_URL" ".backup '${db_backup_path}'"

# Paths to archive (add FILES_PATH and database backup path)
paths_to_archive=(
    "$FILES_PATH"
    "$db_backup_path"
)

# Create the tar.gz archive, including the database backup and file storage
tar -czvf "$backup_filename" "${paths_to_archive[@]}"

# Remove the temporary database backup
rm "$db_backup_path"

# Output success message
echo "Backup created: ${backup_filename}"

# Keep only the 5 most recent backups, remove the rest
backup_dir="./"  # Set the directory where backups are stored

# Find all .tar.gz files, sort by time, and delete all but the 5 most recent
ls -tp ${backup_dir}*.tar.gz | grep -v '/$' | tail -n +6 | xargs -I {} rm -- {}

# Output message indicating old backups were cleaned up
echo "Old backups cleaned, keeping only the 5 most recent."
