# shellcheck shell=bash
# deploy.sh 與 rollback.sh 共用的函式（不要直接執行這個檔案）。
# 約定：腳本放在 SPS_dev 頂層（跟 .env、docker-compose.beta.yml 同一層），並已 cd 到那裡。

HISTORY_FILE=".deploy-history"   # 每行：時間|原版本|新版本|備份檔|部署前最後migration|部署後最後migration|deployed 或 rollback
BACKUP_DIR="backups"
CONTAINERS=(sps-beta-api sps-beta-web sps-beta-admin)
COMPOSE_FILES=(-f docker-compose.beta.yml)
[ -f docker-compose.kms.yml ] && COMPOSE_FILES+=(-f docker-compose.kms.yml)

red()   { printf '\033[31m%s\033[0m\n' "$*" >&2; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }
die()   { red "$*"; exit 1; }

require_cmds() {
  local c
  for c in "$@"; do command -v "$c" >/dev/null || die "缺少指令：$c"; done
}

require_workdir() {
  [ -f docker-compose.beta.yml ] || die "請在 SPS_dev 頂層執行（找不到 docker-compose.beta.yml）"
  [ -f .env ] || die "這個資料夾沒有 .env，請在 .env 所在的 SPS_dev 頂層執行"
}

current_version() {
  local v=""
  v=$(grep -E '^SPS_VERSION=' .env 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' || true)
  if [ -z "$v" ]; then
    v=$(docker inspect --format '{{.Config.Image}}' sps-beta-api 2>/dev/null | sed 's/.*://' || true)
  fi
  echo "$v"
}

# 讀 .env 的 DB_CONNECTION_STRING（Npgsql 格式：Host=…;Port=…;Database=…;Username=…;Password=…），
# 轉成 libpq 的環境變數給 psql／pg_dump／pg_restore 用。密碼只放在環境變數，不印出、不寫進檔案。
# 限制：值裡面含分號（;）要加引號的 Npgsql 寫法不支援。
parse_db_conn() {
  local raw part key val
  raw=$(grep -E '^DB_CONNECTION_STRING=' .env | tail -n1 | cut -d= -f2- || true)
  [ -n "$raw" ] || die ".env 沒有 DB_CONNECTION_STRING"
  raw=${raw%\"}; raw=${raw#\"}; raw=${raw%\'}; raw=${raw#\'}
  local parts=()
  IFS=';' read -r -a parts <<< "$raw"
  PGHOST=""; PGPORT=""; PGDATABASE=""; PGUSER=""; PGPASSWORD=""
  for part in "${parts[@]}"; do
    [ -n "$part" ] || continue
    key=${part%%=*}
    val=${part#*=}
    key=$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
    case "$key" in
      host|server) PGHOST=$val ;;
      port) PGPORT=$val ;;
      database|dbname|initialcatalog) PGDATABASE=$val ;;
      username|user|userid|uid) PGUSER=$val ;;
      password|pwd) PGPASSWORD=$val ;;
    esac
  done
  [ -n "$PGHOST" ] && [ -n "$PGDATABASE" ] && [ -n "$PGUSER" ] || die "DB_CONNECTION_STRING 解析不出 Host／Database／Username"
  export PGHOST PGPORT="${PGPORT:-5432}" PGDATABASE PGUSER PGPASSWORD PGCONNECT_TIMEOUT=10
}

# 資料庫目前最後一個已套用的 EF migration（讀不到就回傳空字串）
db_last_migration() {
  psql -X -At -c 'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 1' 2>/dev/null || true
}

timestamp() { date +%Y%m%d-%H%M%S; }

# 備份目前資料庫到 backups/，檔名＝資料庫名-時間-標籤.dump（pg_dump 自訂格式，用 pg_restore 還原）。印出檔案路徑。
backup_db() {
  local label="$1" file
  mkdir -p "$BACKUP_DIR"
  chmod 700 "$BACKUP_DIR"
  file="$BACKUP_DIR/${PGDATABASE}-$(timestamp)-${label}.dump"
  pg_dump -Fc --no-owner -f "$file" >&2 || { rm -f "$file"; die "資料庫備份失敗，已中止（沒有做任何變更）"; }
  [ -s "$file" ] || { rm -f "$file"; die "備份檔是空的，已中止（沒有做任何變更）"; }
  chmod 600 "$file"
  echo "$file"
}

append_history() { # 原版本 新版本 備份檔 部署前migration 部署後migration 狀態
  printf '%s|%s|%s|%s|%s|%s|%s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" "$2" "$3" "$4" "$5" "$6" >> "$HISTORY_FILE"
}

last_history() { [ -f "$HISTORY_FILE" ] && tail -n1 "$HISTORY_FILE" || true; }

# 問 y/N；預設 N
ask_yes() {
  local ans
  read -r -p "$1 [y/N] " ans || ans=""
  case "$ans" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}

# 要使用者原字輸入某段文字才繼續（用在會丟掉資料的動作）
ask_type() {
  local expected="$1" prompt="$2" ans
  read -r -p "$prompt" ans || ans=""
  [ "$ans" = "$expected" ]
}

# 冒煙測試：等同容器自己的健康檢查，再多看一次（容器內部打自己，不依賴主機網路）
smoke_test() {
  local ok=1
  docker exec sps-beta-api curl -fsS -o /dev/null http://localhost:8080/api/health || { red "  ✗ 後端 /api/health 失敗"; ok=0; }
  docker exec sps-beta-web curl -fsS -o /dev/null http://localhost:3000/sps || { red "  ✗ 前台 /sps 失敗"; ok=0; }
  [ "$ok" -eq 1 ] && green "  ✓ 後端健康檢查、前台首頁都正常"
  [ "$ok" -eq 1 ]
}

# 設定 .env 的某個變數（有就換、沒有就加在最後）。用「覆寫內容」的方式寫回，保留 .env 原本的擁有者與權限（600）。
set_env_value() { # KEY VALUE
  python3 - "$1" "$2" <<'PY'
import re, sys
key, value = sys.argv[1], sys.argv[2]
lines = open(".env", encoding="utf-8").read().split("\n")
pat = re.compile(r"^" + re.escape(key) + r"=")
for i, l in enumerate(lines):
    if pat.match(l):
        lines[i] = "%s=%s" % (key, value); break
else:
    while lines and lines[-1] == "": lines.pop()
    lines += ["%s=%s" % (key, value), ""]
open(".env", "w", encoding="utf-8").write("\n".join(lines))
PY
}

env_value() { grep -E "^$1=" .env 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' || true; }

# 等 api／web／admin 容器就緒（最多 3 分鐘）
wait_healthy() {
  local i c state bad
  for i in $(seq 1 36); do
    bad=0
    for c in "${CONTAINERS[@]}"; do
      state=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$c" 2>/dev/null || echo missing)
      case "$state" in healthy|running) ;; *) bad=1 ;; esac
    done
    [ "$bad" -eq 0 ] && return 0
    sleep 5
  done
  return 1
}
