#!/bin/bash

#############################################
# Automated Backup and Recovery System
# Medical Devices Marketplace Platform
#############################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/medical-devices}"
LOG_DIR="${LOG_DIR:-/var/log/medical-devices}"
DATE_FORMAT="%Y%m%d_%H%M%S"
TIMESTAMP=$(date +"$DATE_FORMAT")
RETENTION_DAYS=${RETENTION_DAYS:-30}
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_debug() {
    if [ "${DEBUG:-0}" = "1" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
    fi
}

# Create necessary directories
setup_directories() {
    log_info "Setting up backup directories..."
    
    mkdir -p "$BACKUP_ROOT"/{database,files,configs,redis,elasticsearch}
    mkdir -p "$LOG_DIR"
    
    # Set proper permissions
    chmod 700 "$BACKUP_ROOT"
    
    log_info "Directories created successfully"
}

# Database backup functions
backup_postgres() {
    local backup_file="$BACKUP_ROOT/database/postgres_${TIMESTAMP}.sql"
    
    log_info "Starting PostgreSQL backup..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -h "${DATABASE_HOST:-localhost}" -p "${DATABASE_PORT:-5432}" > /dev/null 2>&1; then
        log_error "PostgreSQL is not accessible"
        return 1
    fi
    
    # Perform backup with compression
    PGPASSWORD="${DATABASE_PASSWORD}" pg_dump \
        -h "${DATABASE_HOST:-localhost}" \
        -p "${DATABASE_PORT:-5432}" \
        -U "${DATABASE_USER}" \
        -d "${DATABASE_NAME}" \
        --verbose \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --format=custom \
        --compress=9 \
        --file="${backup_file}.gz" 2>> "$LOG_FILE"
    
    # Encrypt if encryption key is provided
    if [ -n "$ENCRYPTION_KEY" ]; then
        log_info "Encrypting database backup..."
        openssl enc -aes-256-cbc -salt -in "${backup_file}.gz" -out "${backup_file}.gz.enc" -pass pass:"$ENCRYPTION_KEY"
        rm "${backup_file}.gz"
        backup_file="${backup_file}.gz.enc"
    else
        backup_file="${backup_file}.gz"
    fi
    
    # Calculate checksum
    sha256sum "$backup_file" > "${backup_file}.sha256"
    
    log_info "PostgreSQL backup completed: $backup_file"
    echo "$backup_file"
}

backup_redis() {
    local backup_dir="$BACKUP_ROOT/redis/redis_${TIMESTAMP}"
    
    log_info "Starting Redis backup..."
    
    # Check if Redis is running
    if ! redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping > /dev/null 2>&1; then
        log_warning "Redis is not accessible, skipping backup"
        return 0
    fi
    
    mkdir -p "$backup_dir"
    
    # Trigger Redis BGSAVE
    redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" BGSAVE
    
    # Wait for backup to complete
    while [ "$(redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" LASTSAVE)" = "$(redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" LASTSAVE)" ]; do
        sleep 1
    done
    
    # Copy dump file
    if [ -f "/var/lib/redis/dump.rdb" ]; then
        cp "/var/lib/redis/dump.rdb" "$backup_dir/dump.rdb"
        
        # Compress
        tar -czf "${backup_dir}.tar.gz" -C "$BACKUP_ROOT/redis" "redis_${TIMESTAMP}"
        rm -rf "$backup_dir"
        
        log_info "Redis backup completed: ${backup_dir}.tar.gz"
    else
        log_warning "Redis dump file not found"
    fi
}

backup_elasticsearch() {
    local backup_name="elasticsearch_${TIMESTAMP}"
    local repo_name="backup_repo"
    
    log_info "Starting Elasticsearch backup..."
    
    # Check if Elasticsearch is running
    if ! curl -s "${ELASTICSEARCH_URL:-http://localhost:9200}/_cluster/health" > /dev/null 2>&1; then
        log_warning "Elasticsearch is not accessible, skipping backup"
        return 0
    fi
    
    # Register snapshot repository if not exists
    curl -X PUT "${ELASTICSEARCH_URL:-http://localhost:9200}/_snapshot/${repo_name}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"type\": \"fs\",
            \"settings\": {
                \"location\": \"$BACKUP_ROOT/elasticsearch\",
                \"compress\": true
            }
        }" 2>> "$LOG_FILE"
    
    # Create snapshot
    curl -X PUT "${ELASTICSEARCH_URL:-http://localhost:9200}/_snapshot/${repo_name}/${backup_name}?wait_for_completion=true" \
        -H 'Content-Type: application/json' \
        -d '{
            "indices": "*",
            "include_global_state": true
        }' 2>> "$LOG_FILE"
    
    log_info "Elasticsearch backup completed: ${backup_name}"
}

# File backup functions
backup_uploads() {
    local backup_file="$BACKUP_ROOT/files/uploads_${TIMESTAMP}.tar.gz"
    
    log_info "Starting uploads backup..."
    
    if [ -d "$PROJECT_ROOT/public/uploads" ]; then
        tar -czf "$backup_file" \
            -C "$PROJECT_ROOT/public" \
            --exclude='*.tmp' \
            --exclude='thumbs' \
            uploads/ 2>> "$LOG_FILE"
        
        # Calculate checksum
        sha256sum "$backup_file" > "${backup_file}.sha256"
        
        log_info "Uploads backup completed: $backup_file"
    else
        log_warning "Uploads directory not found"
    fi
}

backup_configs() {
    local backup_file="$BACKUP_ROOT/configs/configs_${TIMESTAMP}.tar.gz"
    
    log_info "Starting configuration backup..."
    
    # Create temporary directory for configs
    local temp_dir=$(mktemp -d)
    
    # Copy configuration files
    cp "$PROJECT_ROOT/.env.example" "$temp_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/next.config.js" "$temp_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/package.json" "$temp_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/prisma/schema.prisma" "$temp_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/docker-compose.yml" "$temp_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/nginx.conf" "$temp_dir/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/.github" "$temp_dir/" 2>/dev/null || true
    
    # Create archive
    tar -czf "$backup_file" -C "$temp_dir" . 2>> "$LOG_FILE"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_info "Configuration backup completed: $backup_file"
}

# Incremental backup
incremental_backup() {
    local last_backup_file="$BACKUP_ROOT/.last_backup"
    local incremental_file="$BACKUP_ROOT/files/incremental_${TIMESTAMP}.tar.gz"
    
    log_info "Starting incremental backup..."
    
    if [ -f "$last_backup_file" ]; then
        local last_backup_date=$(cat "$last_backup_file")
        
        # Find files modified since last backup
        find "$PROJECT_ROOT" \
            -type f \
            -newer "$last_backup_file" \
            ! -path "*/node_modules/*" \
            ! -path "*/.git/*" \
            ! -path "*/dist/*" \
            ! -path "*/.next/*" \
            -print0 | \
        tar -czf "$incremental_file" --null -T - 2>> "$LOG_FILE"
        
        log_info "Incremental backup completed: $incremental_file"
    else
        log_warning "No previous backup found, performing full backup"
        backup_full
    fi
    
    # Update last backup timestamp
    echo "$TIMESTAMP" > "$last_backup_file"
}

# Full backup
backup_full() {
    log_info "Starting full backup..."
    
    local backup_manifest="$BACKUP_ROOT/manifest_${TIMESTAMP}.json"
    
    # Initialize manifest
    echo "{
        \"timestamp\": \"$TIMESTAMP\",
        \"type\": \"full\",
        \"backups\": []
    }" > "$backup_manifest"
    
    # Backup all components
    local postgres_backup=$(backup_postgres)
    backup_redis
    backup_elasticsearch
    backup_uploads
    backup_configs
    
    # Update manifest with backup locations
    jq --arg postgres "$postgres_backup" \
       '.backups += [{"type": "postgres", "file": $postgres}]' \
       "$backup_manifest" > "${backup_manifest}.tmp" && mv "${backup_manifest}.tmp" "$backup_manifest"
    
    log_info "Full backup completed. Manifest: $backup_manifest"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_ROOT" -type f -mtime +"$RETENTION_DAYS" -delete 2>> "$LOG_FILE"
    
    # Keep at least the last 5 backups regardless of age
    for dir in database files configs redis elasticsearch; do
        if [ -d "$BACKUP_ROOT/$dir" ]; then
            ls -t "$BACKUP_ROOT/$dir" | tail -n +6 | xargs -I {} rm -f "$BACKUP_ROOT/$dir/{}" 2>/dev/null || true
        fi
    done
    
    log_info "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup: $backup_file"
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Verify checksum if available
    if [ -f "${backup_file}.sha256" ]; then
        if sha256sum -c "${backup_file}.sha256" > /dev/null 2>&1; then
            log_info "Checksum verification passed"
        else
            log_error "Checksum verification failed"
            return 1
        fi
    fi
    
    # Test archive integrity
    case "$backup_file" in
        *.tar.gz)
            if tar -tzf "$backup_file" > /dev/null 2>&1; then
                log_info "Archive integrity check passed"
            else
                log_error "Archive integrity check failed"
                return 1
            fi
            ;;
        *.sql.gz)
            if gzip -t "$backup_file" 2>/dev/null; then
                log_info "Compression integrity check passed"
            else
                log_error "Compression integrity check failed"
                return 1
            fi
            ;;
    esac
    
    return 0
}

# Restore functions
restore_postgres() {
    local backup_file="$1"
    
    log_info "Restoring PostgreSQL from: $backup_file"
    
    # Decrypt if necessary
    if [[ "$backup_file" == *.enc ]]; then
        log_info "Decrypting backup..."
        local decrypted_file="${backup_file%.enc}"
        openssl enc -aes-256-cbc -d -in "$backup_file" -out "$decrypted_file" -pass pass:"$ENCRYPTION_KEY"
        backup_file="$decrypted_file"
    fi
    
    # Restore database
    PGPASSWORD="${DATABASE_PASSWORD}" pg_restore \
        -h "${DATABASE_HOST:-localhost}" \
        -p "${DATABASE_PORT:-5432}" \
        -U "${DATABASE_USER}" \
        -d "${DATABASE_NAME}" \
        --clean \
        --if-exists \
        --verbose \
        "$backup_file" 2>> "$LOG_FILE"
    
    log_info "PostgreSQL restore completed"
}

restore_redis() {
    local backup_file="$1"
    
    log_info "Restoring Redis from: $backup_file"
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Stop Redis
    systemctl stop redis || true
    
    # Copy dump file
    cp "$temp_dir/*/dump.rdb" "/var/lib/redis/dump.rdb"
    chown redis:redis "/var/lib/redis/dump.rdb"
    
    # Start Redis
    systemctl start redis
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_info "Redis restore completed"
}

restore_uploads() {
    local backup_file="$1"
    
    log_info "Restoring uploads from: $backup_file"
    
    # Create backup of current uploads
    if [ -d "$PROJECT_ROOT/public/uploads" ]; then
        mv "$PROJECT_ROOT/public/uploads" "$PROJECT_ROOT/public/uploads.old.${TIMESTAMP}"
    fi
    
    # Extract backup
    tar -xzf "$backup_file" -C "$PROJECT_ROOT/public/"
    
    log_info "Uploads restore completed"
}

# Upload to cloud storage
upload_to_cloud() {
    local backup_file="$1"
    local cloud_provider="${CLOUD_PROVIDER:-aws}"
    
    log_info "Uploading backup to cloud storage..."
    
    case "$cloud_provider" in
        aws)
            if command -v aws &> /dev/null; then
                aws s3 cp "$backup_file" "s3://${S3_BUCKET}/backups/$(basename "$backup_file")" \
                    --storage-class "${S3_STORAGE_CLASS:-STANDARD_IA}"
                log_info "Backup uploaded to AWS S3"
            else
                log_warning "AWS CLI not found"
            fi
            ;;
        gcp)
            if command -v gsutil &> /dev/null; then
                gsutil cp "$backup_file" "gs://${GCS_BUCKET}/backups/$(basename "$backup_file")"
                log_info "Backup uploaded to Google Cloud Storage"
            else
                log_warning "gsutil not found"
            fi
            ;;
        azure)
            if command -v az &> /dev/null; then
                az storage blob upload \
                    --account-name "${AZURE_STORAGE_ACCOUNT}" \
                    --container-name "${AZURE_CONTAINER}" \
                    --name "backups/$(basename "$backup_file")" \
                    --file "$backup_file"
                log_info "Backup uploaded to Azure Storage"
            else
                log_warning "Azure CLI not found"
            fi
            ;;
    esac
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Backup $status\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"text\": \"$message\",
                    \"footer\": \"Medical Devices Backup System\",
                    \"ts\": $(date +%s)
                }]
            }" 2>/dev/null || true
    fi
    
    # Email notification
    if [ -n "${NOTIFICATION_EMAIL:-}" ]; then
        echo "$message" | mail -s "Backup $status - Medical Devices Platform" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
}

# Monitor backup status
monitor_backups() {
    log_info "Checking backup status..."
    
    local status_report="$BACKUP_ROOT/status_${TIMESTAMP}.txt"
    
    {
        echo "=== Backup Status Report ==="
        echo "Generated: $(date)"
        echo ""
        
        echo "=== Recent Backups ==="
        for dir in database files configs redis elasticsearch; do
            if [ -d "$BACKUP_ROOT/$dir" ]; then
                echo ""
                echo "[$dir]"
                ls -lh "$BACKUP_ROOT/$dir" | head -5
            fi
        done
        
        echo ""
        echo "=== Disk Usage ==="
        df -h "$BACKUP_ROOT"
        
        echo ""
        echo "=== Backup Size ==="
        du -sh "$BACKUP_ROOT"/*
        
    } > "$status_report"
    
    cat "$status_report"
    log_info "Status report saved: $status_report"
}

# Main execution
main() {
    local action="${1:-backup}"
    local backup_type="${2:-full}"
    
    # Setup logging
    LOG_FILE="$LOG_DIR/backup_${TIMESTAMP}.log"
    mkdir -p "$LOG_DIR"
    
    log_info "Starting backup automation script"
    log_info "Action: $action, Type: $backup_type"
    
    # Setup directories
    setup_directories
    
    case "$action" in
        backup)
            case "$backup_type" in
                full)
                    backup_full
                    ;;
                incremental)
                    incremental_backup
                    ;;
                database)
                    backup_postgres
                    ;;
                files)
                    backup_uploads
                    ;;
                *)
                    log_error "Unknown backup type: $backup_type"
                    exit 1
                    ;;
            esac
            
            # Cleanup old backups
            cleanup_old_backups
            
            # Upload to cloud if configured
            if [ -n "${CLOUD_PROVIDER:-}" ]; then
                upload_to_cloud "$BACKUP_ROOT/manifest_${TIMESTAMP}.json"
            fi
            
            # Send success notification
            send_notification "SUCCESS" "Backup completed successfully at $(date)"
            ;;
            
        restore)
            local backup_path="${3:-}"
            if [ -z "$backup_path" ]; then
                log_error "Backup path required for restore"
                exit 1
            fi
            
            case "$backup_type" in
                database)
                    restore_postgres "$backup_path"
                    ;;
                redis)
                    restore_redis "$backup_path"
                    ;;
                files)
                    restore_uploads "$backup_path"
                    ;;
                *)
                    log_error "Unknown restore type: $backup_type"
                    exit 1
                    ;;
            esac
            ;;
            
        verify)
            local backup_path="${3:-}"
            if [ -z "$backup_path" ]; then
                log_error "Backup path required for verification"
                exit 1
            fi
            verify_backup "$backup_path"
            ;;
            
        monitor)
            monitor_backups
            ;;
            
        *)
            log_error "Unknown action: $action"
            echo "Usage: $0 {backup|restore|verify|monitor} {full|incremental|database|files} [backup_path]"
            exit 1
            ;;
    esac
    
    log_info "Script completed successfully"
}

# Error handling
trap 'log_error "Script failed at line $LINENO"' ERR

# Run main function
main "$@"