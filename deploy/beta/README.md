# SPS beta 部署（正式機資料的複本）

2026-10-14 建立。目標：在正式機這台主機上，用正式資料庫的**複本**（`SPS_dev`）跑一套 beta，與正式機並存、互不影響。
對外網址：前台 `https://match.isafe.org.tw/sps`、後台 `https://match-admin.isafe.org.tw`。

> **2026-11 狀態更新：`SPS_dev` 要成為正式資料庫**（舊 `SPS` 專案停用，不改資料庫名稱，資料庫、資料夾、容器名稱都維持 `SPS_dev`／`sps-beta-*`）。
> 資料裡已經有真實使用者資料、郵件服務已開啟。所以：
> - **不要再對 `SPS_dev` 執行 `sanitize-beta-db.sql`**（它會把寄信、退信收信、ProTrack 關掉；現在它需要明確加 `-v confirm_sanitize=yes` 才會執行）。下面「不能碰正式機的保證」「為什麼一定要先跑 sanitize」兩節只適用於「第一次用正式庫複本建立 beta」的情境，現在僅供參考。
> - 日常操作（部署、回滾、網址設定）請看「日常部署與回滾」一節。

| 檔案 | 用途 |
|---|---|
| `docker-compose.beta.yml` | 三個應用容器＋beta 專用 Redis，固定 IP、**不對主機開 port** |
| `env.beta.example` | 環境變數範本（複製成 `.env` 填值，不要提交） |
| `sanitize-beta-db.sql` | 在 `SPS_dev` 上關掉寄信、退信收信、ProTrack（**第一次啟動前必做**） |
| `nginx-match.conf` | 主機 nginx 設定（直接轉到容器 IP） |
| `deploy.sh`／`rollback.sh`／`deploy-lib.sh` | 部署（先備份資料庫）與回滾（必要時還原備份）；見「日常部署與回滾」 |
| `update-beta.sh` | 檢查 ghcr 有沒有新映像並詢問是否更新（`--check` 只檢查、`-y` 直接更新、帶版本號則指定版本）；複製到 `SPS_dev` 頂層執行 |

## 不能碰正式機的保證

- 只用新的資料夾（`SPS_dev`）、新的網路（`sps-beta-net`，172.31.50.0/24）、新的容器名稱（`sps-beta-*`）、新的 volume（`sps-beta-redis-data`）。
- 資料庫只連 `SPS_dev`。**強烈建議建一個只能存取 `SPS_dev` 的專用帳號**給 beta 用（不要用能碰正式 `SPS` 資料庫的帳號），`.env` 的連線字串用這個帳號。
- JWT 金鑰、Redis 密碼都是 beta 自己的新值。

## 為什麼一定要先跑 sanitize-beta-db.sql

複本裡有正式機的系統設定（`SystemSetting` 資料表）：郵件（SMTP）是啟用的、退信收信是啟用的、ProTrack 有真的 API 金鑰。
後端啟動後會自己去寄信（含複本裡排隊中的群發郵件）、用正式信箱收信、寫入正式的 ProTrack——而資料裡是真實會員的信箱與資料。
所以必須在第一次啟動**之前**執行 `sanitize-beta-db.sql`（只改這三項設定，其他資料不動），並確認輸出的每一列都是 `false`／`t`。
之後若在 beta 後台開啟郵件服務，會用複本裡的正式 SMTP 設定真的寄信，**測試期間不要打開**。

## 擺放方式（照測試機）

```
/home/shareproject/SPS_dev/
├── docker-compose.beta.yml   ← 從 .repo/deploy/beta/ 複製出來（update-beta.sh 會自動更新）
├── update-beta.sh、deploy.sh、rollback.sh、deploy-lib.sh   ← 部署腳本（從 .repo/deploy/beta/ 複製；見下方「日常部署與回滾」）
├── readme.md                 ← 這份說明（從 .repo/deploy/beta/README.md 複製）
├── .env                      ← 設定檔（密鑰，不在 git 裡；由 compose 自動讀取，不用 --env-file）
├── backups/                  ← deploy.sh／rollback.sh 產生的資料庫備份（pg_dump，不會自動刪除）
├── .deploy-history           ← deploy.sh／rollback.sh 的部署紀錄（回滾靠它找上一版與備份）
├── Uploads/                  ← 上傳檔案（從正式機 SPS 複製；掛到容器內 /app/Uploads）
└── .repo/                    ← git clone，只有程式碼與 deploy/beta 的範本
```

所有 docker compose 指令都在 `SPS_dev` 頂層執行：`docker compose -f docker-compose.beta.yml <up -d|ps|logs|pull>`。

## 步驟

```bash
cd /home/shareproject/SPS_dev

# 1. 只取 deploy/beta（repo 裡有很大的舊站靜態檔，不需要）
git clone --depth 1 --filter=blob:none --sparse https://github.com/isha-khh/isha_sps_fontend.git .repo
git -C .repo sparse-checkout set deploy/beta
cp .repo/deploy/beta/docker-compose.beta.yml .
cp .repo/deploy/beta/env.beta.example .env && chmod 600 .env

# 2. 環境變數：編輯 .env
#   DB_CONNECTION_STRING（Database=SPS_dev）、REDIS_PASSWORD（openssl rand -hex 24）、JWT_SECRET_KEY（openssl rand -base64 48）

# 3. 上傳檔案：從正式機複製既有檔案到 beta 的上傳資料夾（來源位置先確認，見下方「上傳檔案」）
mkdir -p Uploads
cp -a <正式機上傳檔案資料夾>/. Uploads/

# 4. 資料庫：關掉寄信、收信、ProTrack（必做，啟動前）
psql "host=10.19.80.11 dbname=SPS_dev user=<有權限的帳號>" -v confirm_sanitize=yes -f .repo/deploy/beta/sanitize-beta-db.sql

# 5. 拉映像並啟動（第一次啟動會自動套用資料庫遷移，看日誌確認）
docker compose -f docker-compose.beta.yml pull
docker compose -f docker-compose.beta.yml up -d
docker logs -f sps-beta-api        # 看到「資料庫遷移完成」與沒有 error 之後 Ctrl+C

# 6. 主機 nginx：把 .repo/deploy/beta/nginx-match.conf 的內容加進設定（match.isafe.org.tw 加 location、match-admin 新增 server），
#    nginx -t 通過才 reload
```

### 上傳檔案

後端把上傳檔案存在 `FileStorage__RootPath`（beta 設為容器內 `/app/Uploads`，掛載到 `SPS_dev/Uploads`）。
**請先確認正式機實際把檔案放在哪裡**（`docker inspect <正式機後端容器名稱> --format '{{json .Mounts}}'`，或 `SPS` 資料夾裡看），
來源若是別的容器路徑（例如 `wwwroot`），把 compose 的掛載與 `FileStorage__RootPath` 調成與正式機一致再複製。

### 驗證

```bash
docker compose -f docker-compose.beta.yml ps          # 四個容器 healthy
curl -s -o /dev/null -w "%{http_code}\n" https://match.isafe.org.tw/sps                # 200
curl -s https://match.isafe.org.tw/api/health                                          # 後端健康檢查
curl -s -o /dev/null -w "%{http_code}\n" https://match-admin.isafe.org.tw/             # 200
docker exec sps-beta-api sh -c 'env | grep -i email'    # 不應有任何 SMTP 設定
```

在 beta 後台確認：「系統設定 → 郵件」是停用狀態。

## 日常部署與回滾

**一次性設定**（只做一次；之後腳本有更新時也重做這幾行，因為 `update-beta.sh` 只會自動更新 compose 檔，不會更新腳本本身）：

```bash
cd /home/shareproject/SPS_dev
git -C .repo pull --ff-only
cp .repo/deploy/beta/{update-beta.sh,deploy.sh,rollback.sh,deploy-lib.sh,cutover.sh,cutover-rollback.sh,cutover-nginx.sh} .
cp .repo/deploy/beta/{nginx-sdd-sps.conf,nginx-sdd-maps.conf,nginx-match-redirect.conf,nginx-security-headers.conf} .
cp .repo/deploy/beta/README.md readme.md
chmod +x update-beta.sh deploy.sh rollback.sh cutover.sh cutover-rollback.sh cutover-nginx.sh
```

主機需要有 `pg_dump`、`pg_restore`、`psql`（`postgresql-client` 套件，版本不要比資料庫舊）與 `docker`、`curl`。

### 部署新版

```bash
cd /home/shareproject/SPS_dev
./deploy.sh                    # 有新版就問你，確認後：備份資料庫 → 更新 → 冒煙測試
./deploy.sh 1.0.0      # 指定版本
./deploy.sh -y                 # 不問直接做
```

做的事：檢查磁碟剩餘空間（預設至少 3GB，`MIN_FREE_GB=5 ./deploy.sh` 可改）→ `pg_dump` 備份到 `backups/` → 記下目前版本與資料庫最後一個 migration（`.deploy-history`）→ 呼叫 `update-beta.sh`（拉最新 compose、改 `.env` 的 `SPS_VERSION`、pull、up -d、等健康）→ 冒煙測試（後端 `/api/health`、前台 `/sps`）。

只想看有沒有新版、不更新：`./update-beta.sh --check`。

### 回滾

```bash
./rollback.sh                       # 回到上一次 deploy.sh 之前的版本
./rollback.sh --to 1.0.0-beta.32    # 回到指定版本
```

- 上一次部署**沒有**套用新的資料庫 migration：只回復程式版本，資料庫不動。
- 上一次部署**有**套用新的 migration（舊版程式可能不能用現在的資料庫）：會停下來讓你選 1）只回復程式、2）連備份一起還原、3）取消。
- 選「還原備份」：資料庫會回到**部署前**那一刻，**備份之後新增、修改的資料都會消失**。要原字輸入資料庫名稱確認，還原前會先把目前資料庫另存成 `backups/…-before-rollback.dump`，還原失敗（單一交易）資料庫會維持原樣。
- 回滾後如果又想回到新版：`./deploy.sh <版本>`。

### 備份檔管理

`backups/` 不會自動刪除。主機磁碟用量偏高時，確認新版穩定後請手動清掉舊的 `.dump`（保留最近一兩份）。備份檔含完整資料庫內容，權限已設為只有擁有者可讀，不要複製到別處。

### nginx 與 deploy.sh／rollback.sh

`deploy.sh`／`rollback.sh` **不碰 nginx**。日常部署與回滾都不需要動 nginx；範本變動時 `update-beta.sh` 會提醒，請自己比對後手動套用，`nginx -t` 通過才 reload。nginx 的切換只在「切換到 sdd.nat.gov.tw」那一次（見下一節，由 `cutover-nginx.sh` 處理）。

### 網站網址（切換到正式網域時）

信件裡的連結用 `.env` 的 `APP_BASE_URL`（前台公開網址，**要含 `/sps`**）與 `APP_ADMIN_BASE_URL`（後台網址）；CORS 來源是 `CORS_ORIGINS`（前台與後台都是同源，通常不用設）。不設就用 compose 裡的預設值（`https://match.isafe.org.tw/sps`、`https://match-admin.isafe.org.tw`）。**不要直接改 `docker-compose.beta.yml`**，`update-beta.sh` 每次更新會用 repo 的版本覆蓋它。改完 `.env` 後：

```bash
docker compose -f docker-compose.beta.yml -f docker-compose.kms.yml up -d api
docker inspect sps-beta-api --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^App__|^CORS_'   # 確認值
```

`.env` 另外還有 `GA_MEASUREMENT_ID`（只在正式網域設）。

### 部署後的快速確認

```bash
docker compose -f docker-compose.beta.yml -f docker-compose.kms.yml ps    # api／web／admin／redis 都是 healthy
tail -n 5 .deploy-history                                                  # 最近的部署紀錄
```

在瀏覽器：前台首頁、一個有圖的內容頁、後台登入各看一次。

## 切換到 sdd.nat.gov.tw（正式上線）

目標：新系統上線到 `https://sdd.nat.gov.tw/sps`，`match.isafe.org.tw/sps` 301 導向 `sdd.nat.gov.tw/sps`，後台維持 `https://match-admin.isafe.org.tw`。資料庫維持 `SPS_dev`（不改名）。

| 腳本／範本 | 用途 |
|---|---|
| `cutover.sh` | 備份資料庫與 `.env` → 改 `.env` 網址 → 重建 api／web 容器 → 呼叫 `cutover-nginx.sh` 切 nginx |
| `cutover-nginx.sh` | **需要 sudo**。把 `sdd.conf` 與 match 站台設定裡我們的 `/sps` location 換成一行 `include`，其他內容一字不動 |
| `cutover-rollback.sh` | 全部還原（nginx、`.env`、容器）；資料庫不動 |
| `nginx-sdd-sps.conf`／`nginx-sdd-maps.conf` | sdd 的 `/sps`、`/sps/api/`、`/sps/hubs/` location，與 http 層的兩個 `map`（用戶 IP、擋 PUT／PATCH／DELETE） |
| `nginx-match-redirect.conf` | match 網域 `/sps` 的 301 |

### 切換前

1. 先用 `./deploy.sh` 部署到 beta.33 以上（圖片網址補 `/sps` 前綴、`.env` 可覆蓋網址都要這個版本以上）。
2. 確認：後台「系統設定 → 郵件」已啟用並寄過測試信；`GA_MEASUREMENT_ID` 是正式資料流（GA 後台「管理 → 資料串流」）；**舊系統的容器維持執行**（腳本不會停它，回滾要靠它）。
3. 先預覽，什麼都不會改：

```bash
cd /home/shareproject/SPS_dev
./cutover.sh --dry-run
```

會列出 `.env` 的變更與 nginx 的 diff。**請看 diff**：只應該是兩個 `/sps` location（sdd）、三個 `/sps` location（match）換成一行 `include`，`^~ /sps/AInspec/` 完全不動。`cutover-nginx.sh` 找不到預期的區塊會中止、不會亂改；match 站台設定檔判斷不出來時，用 `MATCH_SITE=/etc/nginx/sites-available/檔名 ./cutover.sh` 指定。

### 切換

```bash
./cutover.sh
```

流程中會要你輸入 `cutover`（開始）、`yes`（套用 sdd 的 nginx）、確認 sdd 正常後再決定要不要做 match 的 301。每一步 nginx 都會：先備份（`/var/backups/sps-nginx/<時間>-sdd|match/`）→ `nginx -t` → reload → 用 curl 檢查（sdd：`/sps`、`/sps/api/health` 為 200，AInspec 與根路徑的回應和修改前相同；match：`/sps` 與根網址 `/` 都是 301 到 sdd，目標正確），**任何一步不如預期自動還原**。

切完用瀏覽器確認：首頁、登入、一個有圖的內容頁、「我要投稿」頁下載、後台（`match-admin`）、會員信的連結（`App__BaseUrl` 是 `https://sdd.nat.gov.tw/sps`）。

**301 注意**：瀏覽器會長期快取 301。如果之後又要回到 match 網域，已經被導走的使用者會繼續被導向 sdd，直到快取失效。要先試用可以先只做 sdd（`cutover.sh` 問到 match 時選 N），穩定後再做：`sudo ./cutover-nginx.sh apply --only match`。

### 回滾

```bash
./cutover-rollback.sh
```

nginx（match、sdd）依序還原成切換前的備份、`.env` 還原、api／web 重建；流量回到舊系統。**資料庫不會動**：切換後新系統新增的資料（新會員、申請、內容）只在 `SPS_dev`，舊系統看不到。真的要把 `SPS_dev` 還原到切換前（會丟掉切換後的資料），先停 api／web／admin，再用切換時留的備份：

```bash
docker compose -f docker-compose.beta.yml -f docker-compose.kms.yml stop api web admin
pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction -d SPS_dev backups/<切換時的備份>.dump   # 先設好 PG* 連線環境變數
```

### 腳本不處理的

- DNS／F5：`sdd.nat.gov.tw` 本來就指向這台主機、經 F5，這部分不在我們控制。
- `sdd.conf` 裡 `^~ /sps/AInspec/` 是另一個系統，對方之後還會改（`$petroweld_client_ip`）。我們的 `map` 用另外的變數名稱（`$sdd_client_ip`），不依賴它；腳本只換我們自己的兩個 location，改對方區塊不會被我們覆蓋。
- 主機 nginx 要有 `include /etc/nginx/conf.d/*.conf;`（Ubuntu 預設有），`sps-sdd-maps.conf` 才會被載入；`nginx -t` 不通過就會自動還原。
- `cutover-nginx.sh status` 可以看兩個站台目前是否已切換；`restore [備份資料夾]` 可單獨還原。

## 還原／移除 beta

```bash
docker compose -f docker-compose.beta.yml down      # 停掉並移除容器（資料與 volume 保留）
# 再把 nginx 裡加的 location／server 拿掉並 reload
```

`SPS_dev` 資料庫與 `Uploads/` 不會被刪，要清掉請另外手動處理。
