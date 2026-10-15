#!/usr/bin/env bash
# SPS beta 更新腳本：檢查 ghcr 上有沒有比目前更新的映像版本，有就問你要不要更新。
#
# 放在 SPS_dev 頂層（跟 docker-compose.beta.yml 同一層），在那裡執行：
#   ./update-beta.sh            有新版就問你（互動）
#   ./update-beta.sh --check    只檢查不更新（有新版回傳 10，沒有回傳 0，適合排程／通知）
#   ./update-beta.sh -y         有新版就直接更新，不問
#   ./update-beta.sh 1.0.0-beta.7   指定版本（不管是不是比較新）
#
# 更新做的事：
#   1. 從 .repo 拉最新的 deploy/beta，更新 docker-compose.beta.yml / docker-compose.kms.yml
#      （nginx 設定有變動只提醒，不會自動動主機的 nginx）
#   2. 把 .env 的 SPS_VERSION 改成新版（先備份成 .env.bak）
#   3. docker compose pull + up -d（兩個 compose 檔都帶，漏帶 kms 檔 api 會失去 XR 授權簽章憑證）
#   4. 等容器健康，失敗就印出回復到舊版的指令
# 資料庫遷移由 api 容器啟動時自動套用；這個腳本不碰資料庫、不碰正式機的任何東西。
set -euo pipefail

cd "$(dirname "$0")"

REGISTRY="ghcr.io"
OWNER="isha-khh"
IMAGES=(isha-sps-api isha-sps-web isha-sps-admin)
CONTAINERS=(sps-beta-api sps-beta-web sps-beta-admin)
COMPOSE_FILES=(-f docker-compose.beta.yml)
[ -f docker-compose.kms.yml ] && COMPOSE_FILES+=(-f docker-compose.kms.yml)

MODE="ask"
TARGET=""
for arg in "$@"; do
  case "$arg" in
    --check) MODE="check" ;;
    -y|--yes) MODE="yes" ;;
    -h|--help) sed -n '2,17p' "$0"; exit 0 ;;
    *) TARGET="$arg" ;;
  esac
done

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

for cmd in docker curl python3; do
  command -v "$cmd" >/dev/null || { red "缺少指令：$cmd"; exit 1; }
done
[ -f docker-compose.beta.yml ] || { red "請在 SPS_dev 頂層執行（找不到 docker-compose.beta.yml）"; exit 1; }

# 目前版本：.env 的 SPS_VERSION；沒有就讀正在跑的 api 容器的映像 tag
current_version() {
  local v=""
  if [ -f .env ]; then v=$(grep -E '^SPS_VERSION=' .env | tail -n1 | cut -d= -f2- | tr -d '"' || true); fi
  if [ -z "$v" ]; then
    v=$(docker inspect --format '{{.Config.Image}}' sps-beta-api 2>/dev/null | sed 's/.*://' || true)
  fi
  echo "$v"
}

# 列出某映像在 ghcr 上的版本 tag（只留 1.2.3 或 1.2.3-beta.4 這種，略過 latest / sha-*）
list_tags() {
  local image="$1" token
  token=$(curl -fsS "https://${REGISTRY}/token?scope=repository:${OWNER}/${image}:pull" \
    | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))')
  curl -fsS -H "Authorization: Bearer ${token}" "https://${REGISTRY}/v2/${OWNER}/${image}/tags/list?n=1000" \
    | python3 -c 'import sys,json;print("\n".join(json.load(sys.stdin).get("tags") or []))' \
    | grep -E '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$' || true
}

# 依語意化版本排序（1.0.0-beta.6 < 1.0.0 < 1.0.1），由小到大
sort_versions() {
  python3 -c '
import sys, re
def key(v):
    m = re.match(r"^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$", v)
    a, b, c = int(m[1]), int(m[2]), int(m[3])
    pre = m[4]
    if pre is None:
        return (a, b, c, 1, ())
    parts = tuple((0, int(p), "") if p.isdigit() else (1, 0, p) for p in pre.split("."))
    return (a, b, c, 0, parts)
vs = [l.strip() for l in sys.stdin if l.strip()]
print("\n".join(sorted(vs, key=key)))
'
}

CURRENT=$(current_version)
[ -n "$CURRENT" ] || { red "讀不到目前版本（.env 沒有 SPS_VERSION，也沒有正在跑的 sps-beta-api）"; exit 1; }

if [ -n "$TARGET" ]; then
  LATEST="$TARGET"
else
  # 三個映像都要有的版本才算（避免只打包到一半）
  COMMON=""
  for i in "${!IMAGES[@]}"; do
    tags=$(list_tags "${IMAGES[$i]}") || { red "查詢 ${IMAGES[$i]} 的版本失敗（網路不通，或映像不是公開的、需要先 docker login ghcr.io）"; exit 1; }
    if [ "$i" -eq 0 ]; then COMMON="$tags"; else COMMON=$(comm -12 <(echo "$COMMON" | sort) <(echo "$tags" | sort)); fi
  done
  LATEST=$(echo "$COMMON" | sort_versions | tail -n1)
  [ -n "$LATEST" ] || { red "ghcr 上找不到可用的版本"; exit 1; }
fi

echo "目前版本：$(bold "$CURRENT")"
echo "最新版本：$(bold "$LATEST")"

if [ -z "$TARGET" ]; then
  NEWEST=$(printf '%s\n%s\n' "$CURRENT" "$LATEST" | sort_versions | tail -n1)
  if [ "$CURRENT" = "$LATEST" ] || [ "$NEWEST" = "$CURRENT" ]; then
    green "已是最新，不需要更新。"
    exit 0
  fi
  green "發現新的映像版本：$CURRENT → $LATEST"
  [ "$MODE" = "check" ] && exit 10
else
  [ "$MODE" = "check" ] && { echo "（--check 模式，不更新）"; exit 0; }
fi

if [ "$MODE" = "ask" ]; then
  read -r -p "要更新到 ${LATEST} 嗎？[y/N] " ans
  case "$ans" in y|Y|yes|YES) ;; *) echo "已取消。"; exit 0 ;; esac
fi

# 1. 更新 compose 檔（從 .repo 拉）
if [ -d .repo/.git ]; then
  echo "→ 更新 .repo 的 deploy/beta ..."
  OLD_HEAD=$(git -C .repo rev-parse HEAD)
  if git -C .repo pull --ff-only -q; then
    for f in docker-compose.beta.yml docker-compose.kms.yml; do
      if [ -f ".repo/deploy/beta/$f" ] && ! cmp -s ".repo/deploy/beta/$f" "$f" 2>/dev/null; then
        [ -f "$f" ] && cp "$f" "$f.bak"
        cp ".repo/deploy/beta/$f" "$f"
        echo "  已更新 $f（舊的留在 $f.bak）"
      fi
    done
    if ! git -C .repo diff --quiet "$OLD_HEAD" HEAD -- deploy/beta/nginx-match.conf deploy/beta/nginx-security-headers.conf; then
      echo "  提醒：nginx 設定範本有變動（deploy/beta/nginx-*.conf），需要的話請自行比對後套用到主機 nginx（腳本不會動 nginx）。"
    fi
  else
    red "  .repo 更新失敗，沿用現有的 compose 檔繼續。"
  fi
fi

# 2. .env 的 SPS_VERSION
if [ -f .env ]; then
  cp -p .env .env.bak
  if grep -qE '^SPS_VERSION=' .env; then
    sed -i "s|^SPS_VERSION=.*|SPS_VERSION=${LATEST}|" .env
  else
    printf '\nSPS_VERSION=%s\n' "$LATEST" >> .env
  fi
  echo "→ .env 的 SPS_VERSION 已改為 ${LATEST}（備份：.env.bak）"
fi
export SPS_VERSION="$LATEST"

# 3. 拉映像並重建
echo "→ 拉映像 ..."
docker compose "${COMPOSE_FILES[@]}" pull
echo "→ 重建容器 ..."
docker compose "${COMPOSE_FILES[@]}" up -d

# 4. 等健康
echo "→ 等容器就緒（最多 3 分鐘）..."
ok=0
for _ in $(seq 1 36); do
  bad=0
  for c in "${CONTAINERS[@]}"; do
    state=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$c" 2>/dev/null || echo missing)
    case "$state" in healthy|running) ;; *) bad=1 ;; esac
  done
  [ "$bad" -eq 0 ] && { ok=1; break; }
  sleep 5
done

docker compose "${COMPOSE_FILES[@]}" ps
if [ "$ok" -eq 1 ]; then
  green "更新完成：${CURRENT} → ${LATEST}"
else
  red "容器在 3 分鐘內沒有全部就緒，請看日誌：docker compose ${COMPOSE_FILES[*]} logs --tail=100 api"
  echo "要回復到舊版："
  echo "  ./update-beta.sh ${CURRENT}"
  echo "（若這次版本含資料庫遷移，舊版程式可能不相容，回復前先看日誌。）"
  exit 1
fi
