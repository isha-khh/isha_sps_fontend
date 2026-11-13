#!/usr/bin/env bash
# SPS 部署腳本：部署前先備份資料庫、記錄版本，再更新，最後做冒煙測試。
#
# 放在 SPS_dev 頂層（跟 .env、update-beta.sh、deploy-lib.sh 同一層），在那裡執行：
#   ./deploy.sh                 有新版就問你、備份、更新（互動）
#   ./deploy.sh 1.0.0   指定版本
#   ./deploy.sh -y [版本]       不問直接做
#
# 做的事：
#   1. 檢查：指令、.env、磁碟剩餘空間（預設至少 3GB，MIN_FREE_GB 可改）
#   2. pg_dump 備份資料庫到 backups/，並記下目前版本與資料庫最後一個 migration（寫進 .deploy-history）
#   3. 呼叫 update-beta.sh 更新（拉 compose、改 .env、pull、up -d、等健康）
#   4. 冒煙測試；結果寫進 .deploy-history。失敗會告訴你怎麼用 ./rollback.sh 回復
# nginx 設定不在這裡（共用檔，請手動套用）。備份檔不會自動刪除，磁碟快滿時請自行清理 backups/。
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=deploy-lib.sh
. ./deploy-lib.sh

ASSUME_YES=0
TARGET=""
for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=1 ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) TARGET="$arg" ;;
  esac
done

require_cmds docker curl pg_dump psql
require_workdir
[ -x ./update-beta.sh ] || die "找不到 update-beta.sh（請放在同一層並 chmod +x）"
parse_db_conn

CURRENT=$(current_version)
[ -n "$CURRENT" ] || die "讀不到目前版本"
echo "工作資料夾：$PWD"
echo "資料庫：${PGDATABASE}（${PGHOST}:${PGPORT}）"
echo "目前版本：$(bold "$CURRENT")"

# 磁碟空間
FREE_KB=$(df -Pk . | awk 'NR==2{print $4}')
MIN_KB=$(( ${MIN_FREE_GB:-3} * 1024 * 1024 ))
if [ "$FREE_KB" -lt "$MIN_KB" ]; then
  die "磁碟剩餘空間不足 ${MIN_FREE_GB:-3}GB（剩 $((FREE_KB / 1024 / 1024))GB）。請先清理（例如 backups/ 裡舊的備份、docker image prune）再部署。"
fi

# 決定要不要更新
if [ -z "$TARGET" ]; then
  rc=0
  ./update-beta.sh --check || rc=$?
  case "$rc" in
    0) exit 0 ;;                 # 已是最新，update-beta.sh 已經印過訊息
    10) ;;                       # 有新版
    *) die "檢查新版本失敗（update-beta.sh 結束碼 $rc）" ;;
  esac
fi

if [ "$ASSUME_YES" -ne 1 ]; then
  ask_yes "要開始部署${TARGET:+到 $TARGET}（先備份資料庫）嗎？" || { echo "已取消。"; exit 0; }
fi

echo "→ 備份資料庫 ..."
BACKUP=$(backup_db "from-${CURRENT}")
MIG_BEFORE=$(db_last_migration)
green "  備份完成：$BACKUP（$(du -h "$BACKUP" | cut -f1)）"
echo "  部署前最後一個 migration：${MIG_BEFORE:-（讀不到）}"

echo "→ 更新 ..."
if ! ./update-beta.sh -y ${TARGET:+"$TARGET"}; then
  red "update-beta.sh 失敗。.env 已由它還原；請看上面的訊息。資料庫備份仍在 $BACKUP。"
  exit 1
fi

NEW=$(current_version)
MIG_AFTER=$(db_last_migration)
echo "→ 冒煙測試 ..."
if smoke_test; then
  append_history "$CURRENT" "$NEW" "$BACKUP" "$MIG_BEFORE" "$MIG_AFTER" deployed
  green "部署完成：${CURRENT} → ${NEW}"
  if [ "$MIG_BEFORE" != "$MIG_AFTER" ]; then
    echo "  這次有套用資料庫 migration（${MIG_BEFORE:-無} → ${MIG_AFTER:-無}）。如果要回復舊版，rollback.sh 會問你要不要一併還原備份。"
  fi
  echo "  備份：$BACKUP（確定穩定後可以手動刪除舊備份）"
else
  append_history "$CURRENT" "$NEW" "$BACKUP" "$MIG_BEFORE" "$MIG_AFTER" deployed
  red "冒煙測試失敗。要回復：./rollback.sh"
  exit 1
fi
