#!/usr/bin/env bash
set -Eeuo pipefail

# Gdzie leżą skrypty
PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
SCRIPTS_DIR="${SCRIPTS_DIR:-${PROJECT_DIR}}"

# Domyślne katalogi backupów (możesz nadpisać)
BACKUP_DIR_WIZY="${BACKUP_DIR_WIZY:-${PROJECT_DIR}/backups/wizy}"
BACKUP_DIR_HOME="${BACKUP_DIR_HOME:-${PROJECT_DIR}/backups/home}"

log(){ printf "[%s] %s\n" "$(date +'%F %T')" "$*" >&2; }
die(){ log "ERROR: $*"; exit 1; }

cd "$PROJECT_DIR"

# Ustaw wspólne flagi – nadpisywalne z zewnątrz
export INCLUDE_DB_RAW="${INCLUDE_DB_RAW:-false}"
export RETENTION_DAYS="${RETENTION_DAYS:-14}"
export MIGRATION_ENABLED="${MIGRATION_ENABLED:-false}"
export MIGRATION_METHOD="${MIGRATION_METHOD:-rsync}"
export MIGRATE_USER="${MIGRATE_USER:-root}"
export MIGRATE_HOST="${MIGRATE_HOST:-example.com}"
export SSH_OPTS="${SSH_OPTS:-}"

# Uruchom backup WIZY
log "== Backup WIZY =="
BACKUP_DIR="$BACKUP_DIR_WIZY" PROJECT_DIR="$PROJECT_DIR" \
bash "${SCRIPTS_DIR}/backup_wizy.sh"

# Uruchom backup HOME
log "== Backup HOME =="
BACKUP_DIR="$BACKUP_DIR_HOME" PROJECT_DIR="$PROJECT_DIR" \
bash "${SCRIPTS_DIR}/backup_home.sh"

log "== Wszystko gotowe =="
