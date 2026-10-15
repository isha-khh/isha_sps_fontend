# SPS beta 部署（正式機資料的複本）

2026-10-14 建立。目標：在正式機這台主機上，用正式資料庫的**複本**（`SPS_dev`）跑一套 beta，與正式機並存、互不影響。
對外網址：前台 `https://match.isafe.org.tw/sps`、後台 `https://match-admin.isafe.org.tw`。

| 檔案 | 用途 |
|---|---|
| `docker-compose.beta.yml` | 三個應用容器＋beta 專用 Redis，固定 IP、**不對主機開 port** |
| `env.beta.example` | 環境變數範本（複製成 `.env` 填值，不要提交） |
| `sanitize-beta-db.sql` | 在 `SPS_dev` 上關掉寄信、退信收信、ProTrack（**第一次啟動前必做**） |
| `nginx-match.conf` | 主機 nginx 設定（直接轉到容器 IP） |
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
├── docker-compose.beta.yml   ← 從 .repo/deploy/beta/ 複製出來
├── .env                      ← 設定檔（密鑰，不在 git 裡；由 compose 自動讀取，不用 --env-file）
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
psql "host=10.19.80.11 dbname=SPS_dev user=<有權限的帳號>" -f .repo/deploy/beta/sanitize-beta-db.sql

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

## 更新到新版

```bash
# SPS_VERSION 改成新的標籤（.env 或 shell），然後
docker compose -f docker-compose.beta.yml pull
docker compose -f docker-compose.beta.yml up -d
```

新版若含資料庫遷移，會在後端啟動時自動套用到 `SPS_dev`。

## 還原／移除 beta

```bash
docker compose -f docker-compose.beta.yml down      # 停掉並移除容器（資料與 volume 保留）
# 再把 nginx 裡加的 location／server 拿掉並 reload
```

`SPS_dev` 資料庫與 `Uploads/` 不會被刪，要清掉請另外手動處理。
