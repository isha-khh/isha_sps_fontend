#!/usr/bin/env bash
# 正式切換：新系統上線到 https://sdd.nat.gov.tw/sps，match.isafe.org.tw/sps 301 到 sdd.nat.gov.tw/sps。
#
# 放在 SPS_dev 頂層（跟 .env 同一層），用一般帳號執行（只有 nginx 那段會呼叫 sudo）：
#   ./cutover.sh --dry-run     只顯示會做什麼（含 nginx 的 diff），什麼都不改
#   ./cutover.sh               正式切換（每個重要步驟會停下來確認）
#   ./cutover.sh --skip-nginx  只做資料庫備份、.env、容器；nginx 你自己處理
#   出問題：./cutover-rollback.sh
#
# 步驟：
#   1. 檢查，顯示計畫，要你輸入 cutover 確認
#   2. 備份資料庫（pg_dump）與 .env
#   3. 改 .env：APP_BASE_URL（信件連結）、APP_ADMIN_BASE_URL、CORS_ORIGINS；沒有 GA_MEASUREMENT_ID 時問你要不要填
#   4. 重建 api／web 容器，確認容器裡的網址值正確
#   5. sudo ./cutover-nginx.sh apply --only sdd：sdd.nat.gov.tw/sps 改指向新系統（先備份、nginx -t、curl 檢查，失敗自動還原）
#   6. 問你要不要接著做 match.isafe.org.tw/sps 的 301（apply --only match）
# 舊系統的容器（sps-nginx 等）這支腳本完全不碰，會繼續跑著，回滾時才有地方可以回去。
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=deploy-lib.sh
. ./deploy-lib.sh

NEW_BASE_URL="${NEW_BASE_URL:-https://sdd.nat.gov.tw/sps}"
NEW_ADMIN_URL="${NEW_ADMIN_URL:-https://match-admin.isafe.org.tw}"
NEW_CORS="${NEW_CORS:-https://sdd.nat.gov.tw,https://match-admin.isafe.org.tw}"
STATE_FILE=".cutover-state"

DRY_RUN=0; SKIP_NGINX=0; ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --skip-nginx) SKIP_NGINX=1 ;;
    -y|--yes) ASSUME_YES=1 ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    *) die "不認得的參數：$arg" ;;
  esac
done

require_cmds docker curl pg_dump psql python3
[ "$SKIP_NGINX" -eq 1 ] || require_cmds sudo
require_workdir
[ "$SKIP_NGINX" -eq 1 ] || [ -x ./cutover-nginx.sh ] || die "找不到 cutover-nginx.sh（請放在同一層並 chmod +x）"
[ ! -f "$STATE_FILE" ] || die "已經有 $STATE_FILE（上次切換還沒收尾）。若要回復請執行 ./cutover-rollback.sh；確定不需要再手動刪除這個檔案。"
parse_db_conn

echo "工作資料夾：$PWD"
echo "資料庫：${PGDATABASE}（${PGHOST}:${PGPORT}）"
echo "目前版本：$(current_version)"

FREE_KB=$(df -Pk . | awk 'NR==2{print $4}')
[ "$FREE_KB" -ge $(( ${MIN_FREE_GB:-3} * 1024 * 1024 )) ] || die "磁碟剩餘空間不足 ${MIN_FREE_GB:-3}GB"
for c in "${CONTAINERS[@]}"; do
  state=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$c" 2>/dev/null || echo missing)
  case "$state" in healthy|running) ;; *) die "容器 $c 目前不是健康狀態（$state），請先處理再切換" ;; esac
done

show_change() { printf '  %-22s %s  →  %s\n' "$1" "${2:-（未設定，用預設值）}" "$3"; }
echo
bold "計畫："
echo "  .env 變更："
show_change APP_BASE_URL "$(env_value APP_BASE_URL)" "$NEW_BASE_URL"
show_change APP_ADMIN_BASE_URL "$(env_value APP_ADMIN_BASE_URL)" "$NEW_ADMIN_URL"
show_change CORS_ORIGINS "$(env_value CORS_ORIGINS)" "$NEW_CORS"
echo "  GA_MEASUREMENT_ID：$([ -n "$(env_value GA_MEASUREMENT_ID)" ] && echo '已設定，不變' || echo '目前沒有（切換時會問你要不要填）')"
echo "  重建容器：api、web（admin、redis 不動）"
if [ "$SKIP_NGINX" -eq 1 ]; then echo "  nginx：略過（--skip-nginx）"; else echo "  nginx：sdd.nat.gov.tw/sps 改指向新系統 → 再問你要不要把 match.isafe.org.tw/sps 301 到 sdd.nat.gov.tw/sps"; fi
echo

if [ "$DRY_RUN" -eq 1 ]; then
  if [ "$SKIP_NGINX" -eq 0 ]; then
    echo "--- nginx 預覽（--dry-run，不會修改任何檔案）---"
    ./cutover-nginx.sh apply --dry-run || red "（nginx 預覽失敗或不完整，請看上面的訊息；正式切換前必須先解決）"
  fi
  echo "（--dry-run：什麼都沒改）"
  exit 0
fi

ask_type cutover "確定要開始正式切換？請輸入 cutover：" || { echo "已取消。"; exit 0; }

TS=$(timestamp)
echo "→ 備份資料庫 ..."
DB_BACKUP=$(backup_db "before-cutover")
green "  $DB_BACKUP（$(du -h "$DB_BACKUP" | cut -f1)）"
ENV_BACKUP=".env.cutover-${TS}.bak"
cp -p .env "$ENV_BACKUP"
printf 'CUTOVER_TS="%s"\nENV_BACKUP="%s"\nDB_BACKUP="%s"\nNGINX_DIRS=""\n' "$TS" "$ENV_BACKUP" "$DB_BACKUP" > "$STATE_FILE"
chmod 600 "$STATE_FILE"
green "  .env 備份：$ENV_BACKUP"
trap 'rc=$?; [ $rc -eq 0 ] || red "中途失敗（結束碼 $rc）。要回復請執行 ./cutover-rollback.sh"' EXIT

echo "→ 修改 .env ..."
set_env_value APP_BASE_URL "$NEW_BASE_URL"
set_env_value APP_ADMIN_BASE_URL "$NEW_ADMIN_URL"
set_env_value CORS_ORIGINS "$NEW_CORS"
if [ -z "$(env_value GA_MEASUREMENT_ID)" ] && [ "$ASSUME_YES" -ne 1 ]; then
  read -r -p "要現在填入正式的 GA 衡量 ID 嗎？（G-XXXXXXXXXX；直接按 Enter 略過，之後再改 .env）" ga || ga=""
  if [ -n "$ga" ]; then
    [[ "$ga" =~ ^G-[A-Z0-9]{6,}$ ]] || die "格式不對（要像 G-ABC123XYZ）。.env 的 GA 沒有改，其他變更已寫入；請執行 ./cutover-rollback.sh 或重新執行。"
    set_env_value GA_MEASUREMENT_ID "$ga"
  fi
fi

echo "→ 重建 api、web 容器 ..."
docker compose "${COMPOSE_FILES[@]}" up -d api web
wait_healthy || die "容器 3 分鐘內沒有全部就緒：docker compose ${COMPOSE_FILES[*]} logs --tail=100 api"
got=$(docker inspect sps-beta-api --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^App__BaseUrl=' | cut -d= -f2-)
[ "$got" = "$NEW_BASE_URL" ] || die "api 容器的 App__BaseUrl 是「$got」，不是預期的「$NEW_BASE_URL」"
green "  容器就緒，App__BaseUrl=$got"
smoke_test || die "冒煙測試失敗"

if [ "$SKIP_NGINX" -eq 1 ]; then
  green "已完成（略過 nginx）。nginx 範本：nginx-sdd-sps.conf、nginx-sdd-maps.conf、nginx-match-redirect.conf"
  exit 0
fi

run_nginx() { # --only sdd|match
  local out; out=$(mktemp)
  if sudo ./cutover-nginx.sh apply "$@" | tee "$out"; then
    local dirs; dirs=$(grep '^NGINX_BACKUP_DIRS=' "$out" | tail -n1 | cut -d= -f2- || true)
    rm -f "$out"
    if [ -n "$dirs" ]; then
      local cur; cur=$(grep '^NGINX_DIRS=' "$STATE_FILE" | cut -d= -f2- | tr -d '"')
      sed -i.tmp "s|^NGINX_DIRS=.*|NGINX_DIRS=\"${cur:+$cur }${dirs}\"|" "$STATE_FILE"; rm -f "$STATE_FILE.tmp"
    fi
  else
    rm -f "$out"; return 1
  fi
}

echo
bold "→ nginx：sdd.nat.gov.tw/sps 改指向新系統"
run_nginx --only sdd || die "nginx（sdd）沒有套用成功（已由腳本還原）。容器與 .env 已是新設定：可修好後重跑 sudo ./cutover-nginx.sh apply --only sdd，或 ./cutover-rollback.sh 全部回復"

echo
echo "請先用瀏覽器確認 https://sdd.nat.gov.tw/sps 是新系統：首頁、登入、一個有圖的內容頁、後台（https://match-admin.isafe.org.tw）。"
if ask_yes "確認 sdd 正常，要接著把 match.isafe.org.tw/sps 301 到 sdd.nat.gov.tw/sps 嗎？（301 會被瀏覽器長期快取）"; then
  run_nginx --only match || red "match 的 301 沒有套用成功（已還原）。sdd 已切換完成；可稍後重跑 sudo ./cutover-nginx.sh apply --only match"
else
  echo "略過。之後要做：sudo ./cutover-nginx.sh apply --only match"
fi
trap - EXIT
green "切換完成。回滾：./cutover-rollback.sh（舊系統容器仍在執行，nginx 還原後流量會回到舊系統）"
