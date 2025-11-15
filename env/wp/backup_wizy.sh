#!/usr/bin/env bash
set -Eeuo pipefail

# ===== USTAWIENIA (możesz nadpisać zmiennymi środowiskowymi) =====
PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups/wizy}"

DB_SERVICE="${DB_SERVICE:-db}"
WP_SERVICE="${WP_SERVICE:-wordpress}"
WP_VOLUME="${WP_VOLUME:-wp_data}"
DB_VOLUME="${DB_VOLUME:-db_data}"

INCLUDE_DB_RAW="${INCLUDE_DB_RAW:-false}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
EXTRA_PATHS="${EXTRA_PATHS:-nginx docker-compose.yml .env}"
DOCKER_COMPOSE="${DOCKER_COMPOSE:-docker compose}"

# Migracja (opcjonalnie)
MIGRATION_ENABLED="${MIGRATION_ENABLED:-false}"
MIGRATION_METHOD="${MIGRATION_METHOD:-rsync}" # rsync|scp
MIGRATE_USER="${MIGRATE_USER:-root}"
MIGRATE_HOST="${MIGRATE_HOST:-example.com}"
MIGRATE_DIR="${MIGRATE_DIR:-/srv/wp-backups/wizy}"
SSH_OPTS="${SSH_OPTS:-}"

# ===== FUNKCJE WSPÓLNE =====
ts() { date +"%Y-%m-%d_%H-%M-%S"; }
log(){ printf "[%s] %s\n" "$(date +'%F %T')" "$*" >&2; }
die(){ log "ERROR: $*"; exit 1; }
need(){ command -v "$1" >/dev/null 2>&1 || die "Brak programu: $1"; }

need docker; need tar; need gzip; need sha256sum

cd "$PROJECT_DIR"
# załaduj .env
if [[ -f .env ]]; then
  set -o allexport
  # shellcheck disable=SC2046
  eval $(grep -v '^\s*#' .env | sed 's/^\s*export\s\+//')
  set +o allexport
fi

mkdir -p "$BACKUP_DIR"
TS="$(ts)"
WORKDIR="${BACKUP_DIR}/tmp_${TS}"
ARCHIVE="${BACKUP_DIR}/wizy_backup_${TS}.tar.gz"
mkdir -p "$WORKDIR"

DB_CID="$($DOCKER_COMPOSE ps -q "$DB_SERVICE")"
WP_CID="$($DOCKER_COMPOSE ps -q "$WP_SERVICE")"
[[ -n "$DB_CID" ]] || die "Nie znaleziono kontenera DB ($DB_SERVICE)"
[[ -n "$WP_CID" ]] || die "Nie znaleziono kontenera WP ($WP_SERVICE)"

# ------ Dump DB ------
dump_db(){
  : "${MYSQL_DATABASE:?Brak MYSQL_DATABASE w .env}"
  : "${MYSQL_USER:?Brak MYSQL_USER w .env}"
  : "${MYSQL_PASSWORD:?Brak MYSQL_PASSWORD w .env}"
  log "Dump DB: ${MYSQL_DATABASE}"
  docker exec "$DB_CID" sh -c \
    'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
    > "${WORKDIR}/db_${MYSQL_DATABASE}.sql"
}

# ------ Snapshot wolumenów ------
snap_vol(){ # vol out.tgz
  log "Archiwizuję wolumen $1 -> $2"
  docker run --rm -v "$1:/data:ro" -w /data alpine tar czf - . > "$2"
}

backup_wp(){ snap_vol "$WP_VOLUME" "${WORKDIR}/wp_files.tar.gz"; }
backup_db_raw(){ [[ "$INCLUDE_DB_RAW" == "true" ]] && snap_vol "$DB_VOLUME" "${WORKDIR}/db_volume_raw.tar.gz" || log "RAW DB pominięty"; }
backup_extra(){
  log "Pakuję extra: ${EXTRA_PATHS}"
  tar czf "${WORKDIR}/extra.tar.gz" ${EXTRA_PATHS} || log "Uwaga: część EXTRA może nie istnieć"
}

# ------ Final pack + rotate ------
pack_all(){
  log "Tworzę archiwum: $ARCHIVE"
  tar -C "$WORKDIR" -czf "$ARCHIVE" $(ls -1 "$WORKDIR")
  sha256sum "$ARCHIVE" > "${ARCHIVE}.sha256"
}

rotate(){
  log "Rotacja ${RETENTION_DAYS}d"
  find "$BACKUP_DIR" -maxdepth 1 -type f -name "wizy_backup_*.tar.gz*" -mtime +${RETENTION_DAYS} -print -delete || true
}

migrate(){
  [[ "$MIGRATION_ENABLED" == "true" ]] || { log "Migracja OFF"; return 0; }
  log "Migracja -> ${MIGRATE_USER}@${MIGRATE_HOST}:${MIGRATE_DIR} metodą ${MIGRATION_METHOD}"
  if [[ "$MIGRATION_METHOD" == "rsync" ]]; then
    need rsync
    rsync -avz --progress -e "ssh ${SSH_OPTS}" "$ARCHIVE" "${ARCHIVE}.sha256" "${MIGRATE_USER}@${MIGRATE_HOST}:${MIGRATE_DIR}/"
  else
    need scp
    scp ${SSH_OPTS} "$ARCHIVE" "${ARCHIVE}.sha256" "${MIGRATE_USER}@${MIGRATE_HOST}:${MIGRATE_DIR}/"
  fi
}

cleanup(){ rm -rf "$WORKDIR"; }

main(){
  dump_db
  backup_wp
  backup_db_raw
  backup_extra
  pack_all
  rotate
  migrate
  cleanup
  log "OK: $ARCHIVE"
}
main "$@"
