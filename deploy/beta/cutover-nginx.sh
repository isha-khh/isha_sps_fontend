#!/usr/bin/env bash
# 切換主機 nginx（需要 root）：sdd.nat.gov.tw/sps 改指向新系統，match.isafe.org.tw 與 match.isafe.org.tw/sps（含其下所有路徑）301 到 sdd.nat.gov.tw/sps。
# 通常由 cutover.sh／cutover-rollback.sh 呼叫；也可以單獨執行：
#   sudo ./cutover-nginx.sh apply --dry-run        只顯示會做的修改（diff），什麼都不動（不需要 sudo 也能看，除非檔案有權限限制）
#   sudo ./cutover-nginx.sh apply --only sdd       只做 sdd.nat.gov.tw
#   sudo ./cutover-nginx.sh apply --only match     只做 match.isafe.org.tw 的 301（根網址與 /sps；要在 sdd 切換並確認正常之後；已套用過但範本更新時會只更新 snippet）
#   sudo ./cutover-nginx.sh apply                  兩個都做（先 sdd 再 match）
#   sudo ./cutover-nginx.sh restore [備份資料夾]   還原（預設最近一次）
#   sudo ./cutover-nginx.sh status
#
# 修改方式（不整檔覆蓋，因為 sdd.conf 另有 AInspec 等其他系統的區塊、而且對方會自己改）：
#   只把我們的 location 區塊換成一行 include，其他內容一字不動；改之前把原檔備份到 /var/backups/sps-nginx/<時間>/；
#   改完 nginx -t，不通過就自動還原；reload 後用 curl 檢查，不如預期也自動還原。
# 找不到預期的 location（例如有人手改過）就中止、什麼都不改。
set -euo pipefail

SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
NGINX_DIR="${NGINX_DIR:-/etc/nginx}"
BACKUP_ROOT="${SPS_NGINX_BACKUP_ROOT:-/var/backups/sps-nginx}"
SDD_INCLUDE='include snippets/sps-sdd-locations.conf;'
MATCH_INCLUDE='include snippets/sps-match-redirect.conf;'

red()   { printf '\033[31m%s\033[0m\n' "$*" >&2; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
die()   { red "$*"; exit 1; }
ts()    { date +%Y%m%d-%H%M%S; }

# 範本檔：跟腳本同一層，沒有就找 .repo/deploy/beta
find_src() {
  local f="$1"
  if [ -f "$SELF_DIR/$f" ]; then echo "$SELF_DIR/$f"
  elif [ -f "$SELF_DIR/.repo/deploy/beta/$f" ]; then echo "$SELF_DIR/.repo/deploy/beta/$f"
  else die "找不到範本檔 $f（請放在 $SELF_DIR 或 $SELF_DIR/.repo/deploy/beta/）"; fi
}

need_root() {
  if [ "$NGINX_DIR" = /etc/nginx ] && [ "$(id -u)" -ne 0 ]; then
    die "請用 sudo 執行：sudo $0 $*"
  fi
}

reload_nginx() {
  [ "$NGINX_DIR" = /etc/nginx ] || { echo "（測試模式，略過 reload）"; return 0; }
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then systemctl reload nginx; else nginx -s reload; fi
}

nginx_test() { nginx -t -c "$NGINX_DIR/nginx.conf" >/dev/null 2>&1; }

# 站台設定檔：sites-enabled 的實體檔（符號連結就解開），沒有就用 sites-available
resolve_sdd() {
  if [ -n "${SDD_SITE:-}" ]; then echo "$SDD_SITE"; return; fi
  local f
  for f in "$NGINX_DIR/sites-enabled/sdd.conf" "$NGINX_DIR/sites-available/sdd.conf"; do
    [ -e "$f" ] && { readlink -f "$f"; return; }
  done
  die "找不到 sdd.conf（可用 SDD_SITE=/路徑 指定）"
}
resolve_match() {
  if [ -n "${MATCH_SITE:-}" ]; then echo "$MATCH_SITE"; return; fi
  local hits=() f
  for f in "$NGINX_DIR"/sites-enabled/* "$NGINX_DIR"/conf.d/*.conf; do
    [ -f "$f" ] || continue
    # 要同時符合：server_name 有 match.isafe.org.tw，而且檔案裡有我們的 /sps location（或已套用過的 include）。
    # 只看 server_name 會誤判：match-admin 的設定檔有一個 80 埠的 server 也列了 match.isafe.org.tw（只做 http→https 轉址）。
    if grep -qE 'server_name[^;]*[[:space:]]match\.isafe\.org\.tw([[:space:];])' "$f" \
       && grep -qE "^[[:space:]]*location[[:space:]]+/sps(/api/|/hubs/)?[[:space:]]*\{|sps-match-redirect\.conf" "$f"; then
      hits+=("$(readlink -f "$f")")
    fi
  done
  local uniq; uniq=$(printf '%s\n' "${hits[@]:-}" | sort -u | grep -v '^$' || true)
  [ "$(printf '%s\n' "$uniq" | grep -c .)" -eq 1 ] || die "無法唯一判定 match.isafe.org.tw 的設定檔（找到：${uniq:-無}）。請用 MATCH_SITE=/路徑 指定。"
  echo "$uniq"
}

# 回傳 HTTP 狀態碼|轉址目標。走本機 443（--resolve），不經 F5／DNS；-k 因為 sdd 網域用的是 isafe.org.tw 憑證。
probe() { # host path
  curl -sk -o /dev/null --max-time 10 --resolve "$1:443:127.0.0.1" -w '%{http_code}|%{redirect_url}' "https://$1$2" || echo "000|"
}
code_of() { echo "${1%%|*}"; }

# 用 python 做精確的區塊替換：mode=sdd|match；輸出新內容到 outfile；結束碼 0 成功、3 已經套用過、1 錯誤
edit_site() { # mode infile outfile
  python3 - "$1" "$2" "$3" "$SDD_INCLUDE" "$MATCH_INCLUDE" "$(date '+%Y-%m-%d %H:%M')" <<'PY'
import re, sys
mode, infile, outfile, sdd_inc, match_inc, now = sys.argv[1:7]
src = open(infile, encoding="utf-8").read()
inc = sdd_inc if mode == "sdd" else match_inc
if inc in src:
    print("已經套用過（找到 %s）" % inc); sys.exit(3)

def block_span(text, header_re):
    ms = list(re.finditer(header_re, text, re.M))
    if len(ms) > 1:
        print("找到多個符合 %r 的區塊，無法判斷要換哪一個" % header_re); sys.exit(1)
    if not ms:
        return None
    m = ms[0]
    start = text.rfind("\n", 0, m.start()) + 1
    j = text.index("{", m.start()); depth = 0
    while j < len(text):
        c = text[j]
        if c == "#":                      # 註解到行尾，不算大括號
            nl = text.find("\n", j)
            j = len(text) if nl < 0 else nl
            continue
        if c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0: break
        j += 1
    else:
        print("大括號不成對：%r" % header_re); sys.exit(1)
    end = j + 1
    if text[end:end+1] == "\n": end += 1
    # 緊貼在區塊上方、單獨一行的註解（例如「# /sps 原樣送後端」）一起拿掉，避免留下過時說明
    prev = text.rfind("\n", 0, start - 1) + 1 if start > 0 else 0
    if start > 0 and text[prev:start].strip().startswith("#"):
        start = prev
    return start, end

if mode == "sdd":
    headers = [r"^[ \t]*location[ \t]+=[ \t]+/sps[ \t]*\{", r"^[ \t]*location[ \t]+/sps/[ \t]*\{"]
    required = True
else:
    headers = [r"^[ \t]*location[ \t]+/sps/api/[ \t]*\{", r"^[ \t]*location[ \t]+/sps/hubs/[ \t]*\{", r"^[ \t]*location[ \t]+/sps[ \t]*\{"]
    required = False

spans = []
for h in headers:
    s = block_span(src, h)
    if s is None:
        if required:
            print("找不到預期的區塊：%r（sdd.conf 被改過？請手動處理）" % h); sys.exit(1)
    else:
        spans.append(s)
if not spans:
    print("找不到任何要取代的 /sps location（可能還沒加過，或寫法不同），不修改"); sys.exit(1)

spans.sort()
for a, b in zip(spans, spans[1:]):
    if a[1] > b[0]:
        print("區塊範圍重疊，中止"); sys.exit(1)

ain_before = None
if mode == "sdd":
    ain = block_span(src, r"^[ \t]*location[ \t]+\^~[ \t]+/sps/AInspec/[ \t]*\{")
    ain_before = src[ain[0]:ain[1]] if ain else None

first_start = spans[0][0]
indent = re.match(r"[ \t]*", src[first_start:]).group(0) or "    "
note = "%s# SPS 新系統：%s 由 cutover-nginx.sh 取代原本的 /sps location（還原用 cutover-rollback.sh）\n%s%s\n" % (indent, now, indent, inc)
out = []
pos = 0
for i, (a, b) in enumerate(spans):
    out.append(src[pos:a])
    if i == 0:
        out.append(note)
    pos = b
out.append(src[pos:])
new = "".join(out)

if mode == "sdd":
    if ain_before is not None:
        ain2 = block_span(new, r"^[ \t]*location[ \t]+\^~[ \t]+/sps/AInspec/[ \t]*\{")
        if ain2 is None or new[ain2[0]:ain2[1]] != ain_before:
            print("AInspec 區塊在修改後不一致，中止"); sys.exit(1)
open(outfile, "w", encoding="utf-8").write(new)
PY
}

backup_record() { echo "$1" >> "$BK/manifest"; }

# 安裝範本檔到 nginx 目錄；已存在且相同就略過，已存在但不同就先備份再換
install_file() { # src dest
  local src="$1" dest="$2"
  if [ -e "$dest" ]; then
    if cmp -s "$src" "$dest"; then return 0; fi
    mkdir -p "$BK/files"; cp -p "$dest" "$BK/files/$(echo "$dest" | tr '/' '_')"
    backup_record "replaced|$dest|$BK/files/$(echo "$dest" | tr '/' '_')"
  else
    backup_record "created|$dest"
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"; chmod 644 "$dest"
}

restore_dir() { # dir
  local d="$1" kind a b
  [ -f "$d/manifest" ] || die "$d 裡沒有 manifest，不是有效的備份資料夾"
  while IFS='|' read -r kind a b; do
    case "$kind" in
      site|replaced) cp -p "$b" "$a"; echo "  已還原 $a" ;;
      created) rm -f "$a"; echo "  已移除 $a" ;;
    esac
  done < <(tac "$d/manifest" 2>/dev/null || tail -r "$d/manifest")
  nginx_test || die "還原後 nginx -t 仍失敗！請手動檢查（備份在 $d）"
  reload_nginx
  green "已還原並 reload（備份資料夾：$d）"
}

# match 已經套用過（站台設定檔裡已有 include），但範本（例如新增「根網址也轉址」）更新了：只更新 snippet，不動站台設定檔
refresh_match_snippet() {
  local f_redir dest="$NGINX_DIR/snippets/sps-match-redirect.conf"
  f_redir=$(find_src nginx-match-redirect.conf)
  if [ -e "$dest" ] && cmp -s "$f_redir" "$dest"; then echo "  略過（已套用，轉址 snippet 也是最新的）"; return 0; fi
  echo "  已套用過，但轉址 snippet 與範本不同，只更新 $dest（會先備份）"
  [ "${DRY_RUN:-0}" -eq 1 ] && { echo "  --- 將更新的內容（diff）---"; diff -u "$dest" "$f_redir" 2>/dev/null | sed 's/^/  /' || true; echo "  （--dry-run：什麼都沒改）"; return 0; }
  nginx_test || die "套用前 nginx -t 就已經失敗，請先修好現有設定（沒有修改任何檔案）"
  read -r -p "確定更新？（nginx -t 與 curl 檢查失敗會自動還原）請輸入 yes：" ans || ans=""
  [ "$ans" = yes ] || { echo "已取消。"; return 0; }
  BK="$BACKUP_ROOT/$(ts)-match-snippet"; mkdir -p "$BK"; chmod 700 "$BK"
  install_file "$f_redir" "$dest"
  if ! nginx_test; then red "nginx -t 失敗，自動還原..."; restore_dir "$BK"; die "已還原，沒有任何變更生效。"; fi
  reload_nginx; sleep 1
  local ok=1 r
  r=$(probe match.isafe.org.tw /sps); [ "$r" = "301|https://sdd.nat.gov.tw/sps" ] || { red "  ✗ /sps 應為 301，實際 $r"; ok=0; }
  r=$(probe match.isafe.org.tw /);    [ "$r" = "301|https://sdd.nat.gov.tw/sps" ] || { red "  ✗ 根網址 / 應為 301，實際 $r"; ok=0; }
  if [ "$ok" -ne 1 ]; then red "檢查不如預期，自動還原..."; restore_dir "$BK"; die "已還原到修改前。"; fi
  ln -sfn "$BK" "$BACKUP_ROOT/latest"; echo "$BK" >> "$BACKUP_ROOT/applied.list"
  green "  ✓ match 轉址 snippet 已更新（備份：$BK）"
  APPLIED_DIRS+=("$BK")
}

apply_site() { # sdd|match
  local name="$1" site tmp before_root before_extra
  if [ "$name" = sdd ]; then site=$(resolve_sdd); else site=$(resolve_match); fi
  [ -f "$site" ] || die "設定檔不存在：$site"
  echo "=== $name：$site ==="
  tmp=$(mktemp); TMPS+=("$tmp")
  local rc=0
  edit_site "$name" "$site" "$tmp" || rc=$?
  if [ "$rc" -eq 3 ]; then
    if [ "$name" = match ]; then refresh_match_snippet; return 0; fi
    echo "  略過（已套用）"; return 0
  fi
  [ "$rc" -eq 0 ] || die "無法產生新設定，沒有修改任何檔案"
  echo "  --- 將修改的內容（diff）---"
  diff -u "$site" "$tmp" | sed 's/^/  /' || true
  [ "${DRY_RUN:-0}" -eq 1 ] && { echo "  （--dry-run：什麼都沒改）"; return 0; }

  # 範本檔先確認都在（找不到就在動任何東西之前中止）
  local f_maps="" f_loc="" f_hdr="" f_redir=""
  if [ "$name" = sdd ]; then
    f_maps=$(find_src nginx-sdd-maps.conf); f_loc=$(find_src nginx-sdd-sps.conf)
    [ -e "$NGINX_DIR/snippets/sps-security-headers.conf" ] || f_hdr=$(find_src nginx-security-headers.conf)
  else
    f_redir=$(find_src nginx-match-redirect.conf)
  fi

  nginx_test || die "套用前 nginx -t 就已經失敗，請先修好現有設定（沒有修改任何檔案）"
  read -r -p "確定套用到 $site？（會先備份，nginx -t 與 curl 檢查失敗會自動還原）請輸入 yes：" ans || ans=""
  [ "$ans" = yes ] || { echo "已取消。"; return 0; }

  if [ "$name" = sdd ]; then
    before_root=$(probe sdd.nat.gov.tw /); before_extra=$(probe sdd.nat.gov.tw /sps/AInspec/)
  else
    before_root=""; before_extra=""
  fi

  BK="$BACKUP_ROOT/$(ts)-$name"; mkdir -p "$BK"; chmod 700 "$BK"
  cp -p "$site" "$BK/$(basename "$site").orig"
  backup_record "site|$site|$BK/$(basename "$site").orig"
  if [ "$name" = sdd ]; then
    install_file "$f_maps" "$NGINX_DIR/conf.d/sps-sdd-maps.conf"
    install_file "$f_loc" "$NGINX_DIR/snippets/sps-sdd-locations.conf"
    [ -z "$f_hdr" ] || install_file "$f_hdr" "$NGINX_DIR/snippets/sps-security-headers.conf"
  else
    install_file "$f_redir" "$NGINX_DIR/snippets/sps-match-redirect.conf"
  fi
  cat "$tmp" > "$site"          # 覆寫內容、保留原檔的擁有者與權限

  if ! nginx_test; then
    red "nginx -t 失敗，自動還原..."; restore_dir "$BK"; die "已還原，沒有任何變更生效。"
  fi
  reload_nginx; sleep 1

  local ok=1 r
  if [ "$name" = sdd ]; then
    r=$(probe sdd.nat.gov.tw /sps);            [ "$(code_of "$r")" = 200 ] || { red "  ✗ /sps 應為 200，實際 $r"; ok=0; }
    r=$(probe sdd.nat.gov.tw /sps/api/health); [ "$(code_of "$r")" = 200 ] || { red "  ✗ /sps/api/health 應為 200，實際 $r"; ok=0; }
    r=$(probe sdd.nat.gov.tw /sps/AInspec/);   [ "$r" = "$before_extra" ] || { red "  ✗ AInspec 回應改變：之前 $before_extra，現在 $r"; ok=0; }
    r=$(probe sdd.nat.gov.tw /);               [ "$r" = "$before_root" ] || { red "  ✗ 根路徑回應改變：之前 $before_root，現在 $r"; ok=0; }
  else
    r=$(probe match.isafe.org.tw /sps);              [ "$r" = "301|https://sdd.nat.gov.tw/sps" ] || { red "  ✗ /sps 應為 301 到 https://sdd.nat.gov.tw/sps，實際 $r"; ok=0; }
    r=$(probe match.isafe.org.tw "/sps/news?a=1");   [ "$r" = "301|https://sdd.nat.gov.tw/sps/news?a=1" ] || { red "  ✗ /sps/news?a=1 轉址不對，實際 $r"; ok=0; }
    r=$(probe match.isafe.org.tw /);                 [ "$r" = "301|https://sdd.nat.gov.tw/sps" ] || { red "  ✗ 根網址 / 應為 301 到 https://sdd.nat.gov.tw/sps，實際 $r"; ok=0; }
  fi
  if [ "$ok" -ne 1 ]; then
    red "檢查不如預期，自動還原..."; restore_dir "$BK"; die "已還原到修改前。"
  fi
  ln -sfn "$BK" "$BACKUP_ROOT/latest"
  echo "$BK" >> "$BACKUP_ROOT/applied.list"
  green "  ✓ $name 套用完成（備份：$BK）"
  APPLIED_DIRS+=("$BK")
}

CMD="${1:-}"; [ $# -gt 0 ] && shift
DRY_RUN=0; ONLY=""; APPLIED_DIRS=(); TMPS=()
trap 'rm -f "${TMPS[@]:-}"' EXIT
case "$CMD" in
  apply)
    while [ $# -gt 0 ]; do
      case "$1" in
        --dry-run) DRY_RUN=1 ;;
        --only) ONLY="${2:-}"; shift ;;
        *) die "不認得的參數：$1" ;;
      esac; shift
    done
    command -v python3 >/dev/null && command -v curl >/dev/null && command -v nginx >/dev/null || die "需要 python3、curl、nginx"
    [ "$DRY_RUN" -eq 1 ] || { need_root apply; mkdir -p "$BACKUP_ROOT"; chmod 700 "$BACKUP_ROOT"; }
    case "$ONLY" in
      "")    apply_site sdd; apply_site match ;;
      sdd|match) apply_site "$ONLY" ;;
      *) die "--only 只能是 sdd 或 match" ;;
    esac
    # 注意：不能寫成 `[ … ] && printf …`——沒有套用任何站台時（--dry-run、已套用過而略過）這個測試是 false，
    # 會變成整支腳本的結束碼 1，讓 cutover.sh 誤判成失敗。
    if [ "${#APPLIED_DIRS[@]}" -gt 0 ]; then printf 'NGINX_BACKUP_DIRS=%s\n' "${APPLIED_DIRS[*]}"; fi
    ;;
  restore)
    need_root restore
    d="${1:-$BACKUP_ROOT/latest}"
    [ -e "$d" ] || die "找不到備份資料夾：$d"
    restore_dir "$(readlink -f "$d")"
    ;;
  status)
    for pair in "sdd:$(resolve_sdd):$SDD_INCLUDE" "match:$(resolve_match):$MATCH_INCLUDE"; do
      n=${pair%%:*}; rest=${pair#*:}; f=${rest%%:*}; inc=${rest#*:}
      if grep -qF "$inc" "$f"; then echo "$n：已切換（$f）"; else echo "$n：尚未切換（$f）"; fi
    done
    ls -1 "$BACKUP_ROOT" 2>/dev/null | sed 's/^/  備份：/' || true
    ;;
  *) sed -n '2,15p' "$0"; exit 1 ;;
esac
