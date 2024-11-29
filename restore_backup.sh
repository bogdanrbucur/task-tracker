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

# Parse DATABASE_URL to get the actual database file path
db_file_path=$(echo "$DATABASE_URL" | sed -e 's/^file://')

# Verify the database directory exists or can be created
if [ ! -d "$(dirname "$db_file_path")" ]; then
    echo "Database directory does not exist: $(dirname "$db_file_path"). Exiting."
    exit 1
fi

# Locate the most recent backup file
latest_backup=$(ls -t ./backup-*.tar.gz 2>/dev/null | head -n 1)

if [ -z "$latest_backup" ]; then
    echo "No backup files found. Exiting."
    exit 1
fi

echo "Restoring from the most recent backup: $latest_backup"

# Extract the backup contents
temp_restore_dir="./restore_temp"
mkdir -p "$temp_restore_dir"
tar -xzvf "$latest_backup" -C "$temp_restore_dir"

if [ $? -ne 0 ]; then
    echo "Failed to extract the backup archive. Exiting."
    rm -rf "$temp_restore_dir"
    exit 1
fi

# Locate the database backup file within the extracted contents
db_backup_file=$(find "$temp_restore_dir" -type f -name 'backup-*.db' | head -n 1)

if [ -z "$db_backup_file" ]; then
    echo "Database backup file not found in the archive. Exiting."
    rm -rf "$temp_restore_dir"
    exit 1
fi

# Rename the database backup file to "database.db"
renamed_db_file="$temp_restore_dir/database.db"
mv "$db_backup_file" "$renamed_db_file"

if [ $? -ne 0 ]; then
    echo "Failed to rename the database backup file. Exiting."
    rm -rf "$temp_restore_dir"
    exit 1
fi

# Restore the database using SQLite
echo "Restoring database from $renamed_db_file..."
sqlite3 "$db_file_path" ".restore '$renamed_db_file'"

if [ $? -ne 0 ]; then
    echo "Failed to restore the database. Exiting."
    rm -rf "$temp_restore_dir"
    exit 1
fi

# Locate the correct files directory inside the extracted contents
extracted_files_path=$(find "$temp_restore_dir" -type d -name "$(basename "$FILES_PATH")" | head -n 1)

if [ -z "$extracted_files_path" ]; then
    echo "File storage directory not found in the archive. Exiting."
    rm -rf "$temp_restore_dir"
    exit 1
fi

# Restore the file storage
echo "Restoring file storage to $FILES_PATH..."
rsync -a --no-group --delete "$extracted_files_path/" "$FILES_PATH/"

if [ $? -ne 0 ]; then
    echo "Failed to restore file storage. Exiting."
    rm -rf "$temp_restore_dir"
    exit 1
fi

# Adjust permissions for restored files and folders
echo "Setting ownership and permissions for restored files..."
chown -R bogdan "$FILES_PATH" "$(dirname "$db_file_path")"
chmod -R 755 "$FILES_PATH" "$(dirname "$db_file_path")"

if [ $? -ne 0 ]; then
    echo "Failed to set permissions. Exiting."
    rm -rf "$temp_restore_dir"
    exit 1
fi

# Cleanup temporary restore directory
rm -rf "$temp_restore_dir"

echo "Restore completed successfully from backup: $latest_backup"
