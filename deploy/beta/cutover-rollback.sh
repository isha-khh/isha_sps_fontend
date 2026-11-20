#!/usr/bin/env bash
# 回復 cutover.sh 做的事：nginx（sdd 與 match）還原成切換前的備份、.env 還原、api／web 容器重建。
# 資料庫不會動。用一般帳號執行（nginx 那段會呼叫 sudo）：  ./cutover-rollback.sh
#
# 注意：
#   - 回滾後流量回到舊系統（舊系統容器必須還在執行，cutover.sh 沒有停它）。
#   - 新系統在切換後新增的資料（新會員、申請、內容）只存在新系統的資料庫（SPS_dev），舊系統看不到。
#   - 若 match.isafe.org.tw/sps 的 301 已經讓使用者的瀏覽器快取了，這些使用者回滾後仍會先被導向 sdd.nat.gov.tw，直到快取失效。
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=deploy-lib.sh
. ./deploy-lib.sh

STATE_FILE=".cutover-state"
require_cmds docker python3
require_workdir
[ -f "$STATE_FILE" ] || die "找不到 $STATE_FILE，沒有可回復的切換紀錄"
# shellcheck disable=SC1090
. "./$STATE_FILE"
[ -f "${ENV_BACKUP:-}" ] || die "找不到 .env 備份：${ENV_BACKUP:-（未記錄）}"

echo "切換時間：$CUTOVER_TS"
echo "將還原：.env（$ENV_BACKUP）${NGINX_DIRS:+、nginx（$NGINX_DIRS）}"
echo "資料庫備份（不會自動還原）：$DB_BACKUP"
ask_type rollback "確定要回滾？請輸入 rollback：" || { echo "已取消。"; exit 0; }

if [ -n "${NGINX_DIRS:-}" ]; then
  require_cmds sudo
  [ -x ./cutover-nginx.sh ] || die "找不到 cutover-nginx.sh"
  # 後套用的先還原（match 先、sdd 後）
  for d in $(printf '%s\n' $NGINX_DIRS | tac 2>/dev/null || printf '%s\n' $NGINX_DIRS | tail -r); do
    echo "→ 還原 nginx：$d"
    sudo ./cutover-nginx.sh restore "$d"
  done
fi

echo "→ 還原 .env ..."
cat "$ENV_BACKUP" > .env      # 覆寫內容，保留 .env 的擁有者與權限
echo "→ 重建 api、web 容器 ..."
docker compose "${COMPOSE_FILES[@]}" up -d api web
wait_healthy || red "容器 3 分鐘內沒有全部就緒：docker compose ${COMPOSE_FILES[*]} logs --tail=100 api"
smoke_test || true

mv "$STATE_FILE" "$STATE_FILE.rolledback-$CUTOVER_TS"
green "已回滾。"
echo "請用瀏覽器確認 sdd.nat.gov.tw/sps 回到舊系統。若資料庫需要還原到切換前，備份在 $DB_BACKUP（pg_restore 指令見 README，需要你自己決定，這支腳本不會動資料庫）。"
