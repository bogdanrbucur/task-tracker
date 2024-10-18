#!/bin/bash

# Get current date and time in the format YYYY-MM-DD_HH-MM-SS
current_datetime=$(date +'%Y-%m-%d_%H-%M-%S')

# Define the backup filename with the current date and time
backup_filename="backup-${current_datetime}.tar.gz"

# Paths to archive (excluding the SQLite database initially)
paths_to_archive=(
    "./avatars"
    "./attachments"
)

# Define the correct database path and a temporary backup path
db_path="./prisma/db/database.db"  # Replace with actual database path
db_backup_path="./prisma/db/your_database_backup-${current_datetime}.db"

# Perform a safe SQLite backup using the .backup command
sqlite3 ${db_path} ".backup '${db_backup_path}'"

# Add the database backup to the paths to archive
paths_to_archive+=(${db_backup_path})

# Create the tar.gz archive, including the database backup
tar -czvf ${backup_filename} ${paths_to_archive[@]}

# Remove the temporary database backup
rm ${db_backup_path}

# Output success message
echo "Backup created: ${backup_filename}"

# Keep only the 5 most recent backups, remove the rest
backup_dir="./"  # Set the directory where backups are stored

# Find all .tar.gz files, sort by time, and delete all but the 5 most recent
ls -tp ${backup_dir}*.tar.gz | grep -v '/$' | tail -n +6 | xargs -I {} rm -- {}

# Output message indicating old backups were cleaned up
echo "Old backups cleaned, keeping only the 5 most recent."
