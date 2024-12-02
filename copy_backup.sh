#!/bin/bash

# Directory for backups
backup_dir="/mnt/network-backup"

# Copy all .tar.gz files to the network-backup folder
echo "Copying backups to $backup_dir..."
cp ./*.tar.gz "$backup_dir"

# Clear backup files older than 30 days from the network-backup folder
echo "Removing backups older than 30 days from $backup_dir..."
find "$backup_dir" -name "*.tar.gz" -mtime +30 -exec rm {} \;

echo "Backup and cleanup completed successfully."

# How to mount the network drive
# Create a credentials file
# sudo nano /etc/smbcredentials
# Add the following lines
# username=your_username
# password=your_password
# domain=your_domain
# Save and exit
# Change the permissions of the file
# sudo chmod 600 /etc/smbcredentials
# Mount the network drive
# sudo mount -t cifs //server/share /mnt/network-backup -o credentials=/etc/smbcredentials,vers=3.0,uid=$(id -u appuser),gid=$(id -g appuser)
# Replace //server/share with the actual network path
# To auto-mount the network drive on boot, add the following line to /etc/fstab
# //server/share /mnt/network-backup -o credentials=/etc/smbcredentials,vers=3.0,uid=$(id -u appuser),gid=$(id -g appuser)