#!/bin/bash

# PostgreSQL/TimescaleDB Backup Script
# Automated backup solution med rotation og S3 sync

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/opt/cryptoai/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="cryptoai_backup_${DATE}"
RETENTION_DAYS=30
COMPRESSION_LEVEL=9

# Database connection (from environment)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-cryptoai_production}
DB_USER=${DB_USER:-cryptoai_user}

# S3 Configuration (optional)
S3_ENABLED=${BACKUP_S3_ENABLED:-false}
S3_BUCKET=${BACKUP_S3_BUCKET:-cryptoai-backups}
S3_REGION=${BACKUP_S3_REGION:-us-east-1}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if pg_dump exists
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Check if gzip exists
    if ! command -v gzip &> /dev/null; then
        log_error "gzip not found. Please install gzip."
        exit 1
    fi
    
    # Check if aws cli exists (if S3 enabled)
    if [ "$S3_ENABLED" = "true" ] && ! command -v aws &> /dev/null; then
        log_warn "AWS CLI not found. S3 backup will be disabled."
        S3_ENABLED=false
    fi
    
    log_info "Prerequisites check completed"
}

# Test database connection
test_db_connection() {
    log_info "Testing database connection..."
    
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log_info "Database connection successful"
    else
        log_error "Cannot connect to database. Please check connection parameters."
        exit 1
    fi
}

# Create database backup
create_backup() {
    log_info "Starting database backup..."
    
    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.sql"
    local compressed_file="${backup_file}.gz"
    
    # Create backup with pg_dump
    log_info "Creating backup: $backup_file"
    
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --compress=0 \
        --no-password \
        --verbose \
        --file="$backup_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_info "Database backup created successfully"
    else
        log_error "Database backup failed"
        exit 1
    fi
    
    # Compress backup
    log_info "Compressing backup..."
    gzip -"$COMPRESSION_LEVEL" "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_info "Backup compressed: $compressed_file"
        echo "$compressed_file"
    else
        log_error "Backup compression failed"
        exit 1
    fi
}

# Create schema backup (structure only)
create_schema_backup() {
    log_info "Creating schema backup..."
    
    local schema_file="${BACKUP_DIR}/${BACKUP_NAME}_schema.sql"
    
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --schema-only \
        --no-password \
        --file="$schema_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_info "Schema backup created: $schema_file"
        gzip -"$COMPRESSION_LEVEL" "$schema_file"
        log_info "Schema backup compressed: ${schema_file}.gz"
    else
        log_warn "Schema backup failed (non-critical)"
    fi
}

# Backup TimescaleDB specific data
backup_timescaledb_metadata() {
    log_info "Backing up TimescaleDB metadata..."
    
    local metadata_file="${BACKUP_DIR}/${BACKUP_NAME}_timescaledb.sql"
    
    # Export TimescaleDB configuration
    psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --no-password \
        --command="\copy (SELECT * FROM timescaledb_information.hypertables) TO '$metadata_file' WITH CSV HEADER" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_info "TimescaleDB metadata backed up: $metadata_file"
    else
        log_warn "TimescaleDB metadata backup failed (may not be TimescaleDB)"
    fi
}

# Upload to S3 (if enabled)
upload_to_s3() {
    local backup_file="$1"
    
    if [ "$S3_ENABLED" != "true" ]; then
        return 0
    fi
    
    log_info "Uploading backup to S3..."
    
    local s3_key="cryptoai/$(basename "$backup_file")"
    
    aws s3 cp "$backup_file" "s3://${S3_BUCKET}/${s3_key}" \
        --region "$S3_REGION" \
        --storage-class STANDARD_IA
    
    if [ $? -eq 0 ]; then
        log_info "Backup uploaded to S3: s3://${S3_BUCKET}/${s3_key}"
    else
        log_error "S3 upload failed"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "cryptoai_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
    find "$BACKUP_DIR" -name "cryptoai_backup_*_schema.sql.gz" -mtime +"$RETENTION_DAYS" -delete
    
    local deleted_count=$(find "$BACKUP_DIR" -name "cryptoai_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" | wc -l)
    log_info "Deleted $deleted_count old local backups"
    
    # S3 cleanup (if enabled)
    if [ "$S3_ENABLED" = "true" ]; then
        log_info "Cleaning up old S3 backups..."
        
        # List and delete old S3 backups
        aws s3 ls "s3://${S3_BUCKET}/cryptoai/" \
            --region "$S3_REGION" \
            --recursive \
            | awk '$1 <= "'$(date -d "${RETENTION_DAYS} days ago" '+%Y-%m-%d')'" {print $4}' \
            | xargs -I {} aws s3 rm "s3://${S3_BUCKET}/{}"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup integrity..."
    
    # Test gzip integrity
    if gzip -t "$backup_file" 2>/dev/null; then
        log_info "Backup file compression integrity verified"
    else
        log_error "Backup file is corrupted"
        return 1
    fi
    
    # Check file size (should be > 1KB)
    local file_size=$(stat -c%s "$backup_file")
    if [ "$file_size" -gt 1024 ]; then
        log_info "Backup file size acceptable: $(( file_size / 1024 ))KB"
    else
        log_error "Backup file suspiciously small: ${file_size}B"
        return 1
    fi
    
    return 0
}

# Send notification
send_notification() {
    local status="$1"
    local backup_file="$2"
    local file_size="$3"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        local emoji="✅"
        
        if [ "$status" != "success" ]; then
            color="danger"
            emoji="❌"
        fi
        
        local message="{
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"$emoji CryptoAI Database Backup $status\",
                \"fields\": [
                    {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                    {\"title\": \"File\", \"value\": \"$(basename $backup_file)\", \"short\": true},
                    {\"title\": \"Size\", \"value\": \"$file_size\", \"short\": true},
                    {\"title\": \"Date\", \"value\": \"$(date)\", \"short\": true}
                ]
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$message" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1
    fi
}

# Main backup function
main() {
    log_info "Starting CryptoAI database backup process"
    log_info "======================================"
    
    create_backup_dir
    check_prerequisites
    test_db_connection
    
    # Create backups
    backup_file=$(create_backup)
    create_schema_backup
    backup_timescaledb_metadata
    
    # Verify backup
    if verify_backup "$backup_file"; then
        log_info "Backup verification successful"
        
        # Upload to S3
        upload_to_s3 "$backup_file"
        
        # Get file size for notification
        file_size=$(du -h "$backup_file" | cut -f1)
        
        # Send success notification
        send_notification "success" "$backup_file" "$file_size"
        
        log_info "Backup process completed successfully"
        log_info "Backup location: $backup_file"
        log_info "Backup size: $file_size"
        
    else
        log_error "Backup verification failed"
        send_notification "failed" "$backup_file" "unknown"
        exit 1
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    log_info "Backup process finished"
}

# Handle signals
trap 'log_error "Backup interrupted"; exit 1' INT TERM

# Run main function
main "$@"
