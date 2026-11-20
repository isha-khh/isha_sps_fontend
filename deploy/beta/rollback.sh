#!/usr/bin/env bash
# SPS 回滾腳本：回到上一次部署之前的版本，必要時還原部署前的資料庫備份。
#
# 放在 SPS_dev 頂層（跟 .env、update-beta.sh、deploy-lib.sh 同一層），在那裡執行：
#   ./rollback.sh                 回到上一次 deploy.sh 之前的版本
#   ./rollback.sh --to 1.0.0-beta.32   回到指定版本
#
# 資料庫不會悄悄還原：
#   - 上次部署沒有套用新的 migration：只回復程式版本（資料庫不動）
#   - 有套用新的 migration：會停下來讓你選「只回復程式」（舊版可能不相容）或「連備份一起還原」
#   - 「還原備份」會讓資料庫回到備份當下，備份之後的所有新資料都會消失：必須原字輸入資料庫名稱確認，
#     且還原前會先把目前的資料庫另外備份一份（backups/…-before-rollback.dump）。
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=deploy-lib.sh
. ./deploy-lib.sh

TARGET=""
while [ $# -gt 0 ]; do
  case "$1" in
    --to) TARGET="${2:-}"; [ -n "$TARGET" ] || die "--to 後面要接版本號"; shift ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) die "不認得的參數：$1" ;;
  esac
  shift
done

require_cmds docker curl pg_dump psql pg_restore
require_workdir
[ -x ./update-beta.sh ] || die "找不到 update-beta.sh（請放在同一層並 chmod +x）"
parse_db_conn

NOW_VERSION=$(current_version)
MIG_NOW=$(db_last_migration)
LAST=$(last_history)
BACKUP=""
MIG_BEFORE=""
H_FROM=""; H_TO=""; H_STATUS=""
if [ -n "$LAST" ]; then
  IFS='|' read -r _ts H_FROM H_TO BACKUP MIG_BEFORE _mig_after H_STATUS <<< "$LAST"
  if [ -z "$TARGET" ]; then
    [ "$H_STATUS" = "deployed" ] || die "上一筆紀錄已經是回滾（${H_FROM} → ${H_TO}）。請用 --to 指定要回到的版本。"
    TARGET="$H_FROM"
  fi
fi
[ -n "$TARGET" ] || die "沒有部署紀錄（.deploy-history），請用 --to 指定版本，例如：./rollback.sh --to 1.0.0-beta.32"

echo "資料庫：${PGDATABASE}（${PGHOST}:${PGPORT}）"
echo "目前版本：$(bold "$NOW_VERSION")   →   回到：$(bold "$TARGET")"
echo "資料庫目前最後 migration：${MIG_NOW:-（讀不到）}"

RESTORE=0
if [ -n "$BACKUP" ] && [ "$H_STATUS" = "deployed" ] && [ "$TARGET" = "$H_FROM" ] && [ -n "$MIG_BEFORE" ] && [ "$MIG_NOW" != "$MIG_BEFORE" ]; then
  red "上次部署套用了新的資料庫 migration（部署前是 ${MIG_BEFORE}），舊版程式可能無法使用現在的資料庫。"
  echo "  1) 只回復程式版本（資料庫不動；舊版若起不來再回來選 2）"
  echo "  2) 回復程式版本，並把資料庫還原成部署前的備份：$BACKUP"
  echo "     （備份之後新增、修改的資料都會消失）"
  echo "  3) 取消"
  read -r -p "請選擇 [1/2/3] " choice || choice=3
  case "$choice" in
    1) ;;
    2) RESTORE=1 ;;
    *) echo "已取消。"; exit 0 ;;
  esac
else
  ask_yes "要回復程式版本到 ${TARGET} 嗎？（資料庫不動）" || { echo "已取消。"; exit 0; }
fi

if [ "$RESTORE" -eq 1 ]; then
  [ -s "$BACKUP" ] || die "找不到備份檔 $BACKUP，無法還原"
  ask_type "$PGDATABASE" "確定要把資料庫 ${PGDATABASE} 還原成 ${BACKUP}？備份之後的資料會消失。請輸入資料庫名稱確認：" \
    || { echo "輸入不符，已取消（什麼都沒動）。"; exit 0; }

  echo "→ 先備份目前的資料庫（以防還原後反悔）..."
  SAFETY=$(backup_db "before-rollback")
  green "  已備份：$SAFETY"

  echo "→ 停止 api／web／admin（避免還原時有連線寫入）..."
  docker compose "${COMPOSE_FILES[@]}" stop api web admin

  echo "→ 還原資料庫（單一交易：失敗會整個復原，資料庫維持原樣）..."
  if ! pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction -d "$PGDATABASE" "$BACKUP"; then
    red "還原失敗，資料庫維持原樣（單一交易已復原）。容器目前是停止狀態，可用 docker compose ${COMPOSE_FILES[*]} start api web admin 先恢復服務。"
    exit 1
  fi
  green "  資料庫已還原。"
fi

echo "→ 回復程式版本到 ${TARGET} ..."
if ! ./update-beta.sh -y "$TARGET"; then
  red "回復程式版本失敗，請看上面的訊息。"
  exit 1
fi

MIG_AFTER=$(db_last_migration)
echo "→ 冒煙測試 ..."
smoke_test || red "冒煙測試失敗，請看日誌：docker compose ${COMPOSE_FILES[*]} logs --tail=100 api"
append_history "$NOW_VERSION" "$TARGET" "${SAFETY:--}" "${MIG_NOW:-}" "${MIG_AFTER:-}" rollback
green "已回復：${NOW_VERSION} → ${TARGET}"
