# XR 軟體授權 API 文件

給 XR 訓練軟體廠商。版本 1.0（2026-10-14）。

本文件是單檔版，涵蓋整合所需的全部內容。同目錄另附：

- `openapi.yaml`：OpenAPI 3 規格，可匯入 Postman／Swagger UI。
- `離線授權.md`：完全沒有網路的電腦的離線啟用／續期／停用流程（第二期）。
- `samples/LicenseVerifier/`：C# 驗簽範例（只用 .NET 內建 API，`dotnet run` 即可跑）。
- `test-vectors/vectors.json`：驗簽測試向量。

---

## 1. 概觀

XR 軟體可以公開下載，但**必須有授權才能使用**。授權由平台簽發：

```
使用者在平台會員中心取得序號 (XR-XXXX-XXXX-XXXX-XXXX)
        │
軟體：輸入序號 ──► POST /activate ──► 授權檔（綁定這台裝置、有簽章）
        │
軟體：啟動時離線驗簽、檢查裝置與時間；租約快到期時 POST /refresh 換新授權檔
        │
換電腦／移除：POST /deactivate 釋放席次
```

- 平台負責：會員資格判斷（只有企業需求端會員）、簽發、續期、席次管理、撤銷。
- 軟體負責：輸入序號畫面、呼叫 API、驗簽、保存授權檔、沒有有效授權時鎖定功能、離線寬限（見 §6）。

## 2. 環境

| 環境 | 基底網址 | 簽章金鑰 `kid` |
|---|---|---|
| 測試 | `https://sps.isha.net` | `test-2026-10` |
| 正式 | 上線時通知 | `prod-…` |

- 所有端點的路徑與格式在兩個環境**完全相同**，請把「基底網址」與「公鑰集合」做成可設定。
- **請同時內嵌測試與正式兩把公鑰**，依授權檔的 `kid` 選用。測試環境簽的授權在正式環境驗不過，反之亦然。
- 測試環境的金鑰在整合期間不會更換。

### 測試環境簽章公鑰

- `kid`：`test-2026-10`
- 演算法：ECDSA P-256 + SHA-256（JWS 名稱 ES256）
- 格式：SubjectPublicKeyInfo（DER）的 base64

```
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEr8n/5rdlKZC9i7u/4IeJlQ5sBO3tfgQGgX3GCXisl8ycAC5OA0FwIIzJOVcslLk8Ajsh6SnNDa/edrpbnCeYGA==
```

也可以從 `GET /api/license/v1/public-keys` 取得。正式環境公鑰上線時另行提供。

## 3. 通用規則

- 基底路徑：`/api/license/v1`。
- 全程 HTTPS；請求與回應為 JSON（UTF-8）；請求標頭 `Content-Type: application/json`。
- 不使用 cookie、不需要登入或 API 金鑰：身分由序號（啟用）或授權檔（續期、停用）證明。
- 回應皆帶 `Cache-Control: no-store`（`/public-keys` 除外，可快取 5 分鐘）。
- 時間一律 UTC、ISO 8601、到秒，例如 `2026-10-14T10:02:53Z`。
- 欄位名稱為 snake_case。
- 請忽略回應中不認得的欄位，未來可能新增。

## 4. 端點

### 4.1 `POST /activate` 啟用

用序號換授權檔。成功會佔用一個席次並回傳綁定這台裝置的授權檔。同一台裝置（相同 `device_hash`）重複啟用不會多佔席次。

請求：

```json
{
  "license_key": "XR-XXXX-XXXX-XXXX-XXXX",
  "device_hash": "sha256:9f2a0c11d3e4b5a69788c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6",
  "device_name": "辦公室-RTX3060",
  "client_version": "1.0.3"
}
```

| 欄位 | 必填 | 說明 |
|---|---|---|
| `license_key` | 是 | 使用者輸入的序號。大小寫、破折號、空白不拘（伺服器會正規化） |
| `device_hash` | 是 | 這台裝置的穩定指紋，8–200 字元，建議 `sha256:<hex>`（見 §8） |
| `device_name` | 是 | 顯示在會員中心的裝置名稱，最長 200 字元 |
| `client_version` | 否 | 軟體版本，最長 50 字元 |

成功 `200`：

```json
{
  "license": "eyJraWQiOiJ0ZXN0LTIwMjYtMTAi….MEUCIQD…",
  "server_time": "2026-10-14T10:02:53Z"
}
```

### 4.2 `POST /refresh` 續期

用本機現有的授權檔換新的租約（`lease_until` 往後延）。伺服器每次都重新檢查會員資格與授權狀態。

請求：

```json
{
  "license": "<本機現有的授權檔>",
  "device_hash": "sha256:9f2a…",
  "client_version": "1.0.3"
}
```

成功 `200`：同 `/activate` 的回應。請**用新授權檔覆寫本機檔案**，並更新本機記錄的 `server_time`。

### 4.3 `POST /deactivate` 停用這台裝置

使用者換電腦或移除軟體時呼叫，釋放席次。冪等：已停用或找不到也回成功，客戶端清除本機授權即可。

請求：

```json
{ "license": "<授權檔>", "device_hash": "sha256:9f2a…" }
```

成功 `200`：`{ "ok": true }`

### 4.4 `GET /public-keys` 簽章公鑰

成功 `200`：

```json
{
  "keys": [
    {
      "kid": "test-2026-10",
      "alg": "ES256",
      "spki": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEr8n/…",
      "status": "active",
      "not_after": null
    }
  ]
}
```

| 欄位 | 說明 |
|---|---|
| `kid` | 金鑰識別碼，與授權檔 payload 的 `kid` 對應 |
| `spki` | SubjectPublicKeyInfo（DER）的 base64 |
| `status` | `active`（簽發中）、`standby`（待命，之後會切換）、`retiring`（退役中，仍可驗舊授權） |
| `not_after` | 到期時間，`null` 表示無 |

軟體**必須內嵌公鑰**作為信任根；這支端點用來在金鑰輪替時發現新的 `kid`，不要只在執行時從網路取得就信任。

## 5. 授權檔

字串格式：`base64url(payload).base64url(signature)`，兩段以一個 `.` 相連，base64url 不含 `=` 補位。

payload 是 UTF-8 JSON：

```json
{
  "kid": "test-2026-10",
  "license_id": "7df03b86-85fd-41c3-bba4-0990347e7e5b",
  "product": "xr",
  "customer": "範例股份有限公司",
  "member_id": "c009afd2-7a07-4396-8271-a2fc81a495f6",
  "edition": "standard",
  "features": [],
  "seats": 2,
  "device_hash": "sha256:9f2a0c11d3e4b5a69788c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6",
  "issued_at": "2026-10-14T10:02:53Z",
  "valid_until": "2026-11-13T10:02:53Z",
  "lease_until": "2026-11-13T10:02:53Z",
  "server_time": "2026-10-14T10:02:53Z",
  "mode": "online"
}
```

| 欄位 | 說明 |
|---|---|
| `kid` | 簽章金鑰識別碼，用它選內嵌公鑰。`test-` 開頭為測試環境、`prod-` 開頭為正式環境 |
| `license_id`、`member_id` | 識別碼（不含個資） |
| `product` | 固定 `xr`，不是就拒絕 |
| `customer` | 公司名稱，可顯示在「關於」畫面 |
| `edition`、`features` | 預留給功能開關（目前 `standard`、空陣列）。**忽略不認得的值，不要因此報錯** |
| `seats` | 這份授權目前的席次上限，僅供顯示；席次由伺服器控管 |
| `device_hash` | 綁定的裝置，必須等於本機算出的值 |
| `valid_until` | 有沒有權利使用的期限。預設隨會員資格滾動（每次續期往後延），也可能被管理員設上限 |
| `lease_until` | 多久要連線確認一次。**超過這個時間必須先 `/refresh` 才能繼續使用**（離線寬限見 §6） |
| `server_time` | 簽發當下的伺服器時間，用來偵測時鐘倒轉 |
| `mode` | `online` 或 `offline`（離線啟用，見《離線授權》）。舊版沒有此欄位就當作 `online` |
| `nonce` | 只有離線授權檔有；匯入時要與你產生 `.req` 時的 nonce 比對 |

## 6. 驗簽與使用判斷

### 6.1 驗簽（必做，離線即可）

1. 以 `.` 切成兩段，各自 base64url 解碼，得到 `payloadBytes` 與 `signature`。
2. 解析 payload 取得 `kid`，用該 `kid` 的**內嵌公鑰**驗證：`VerifyData(payloadBytes, signature, SHA-256)`。
   - **簽的是 `payloadBytes` 原始位元組**，不要先解析再重新序列化後驗證。
3. 檢查 `product == "xr"`、`device_hash` 等於本機值。

簽章規格：**ECDSA P-256 + SHA-256；簽章編碼為 IEEE P1363（r‖s，固定 64 位元組）。**

> **常見陷阱：簽章編碼。**
> .NET 的 `ECDsa.VerifyData(data, signature, HashAlgorithmName.SHA256)` 預設就是 P1363，直接用即可。
> OpenSSL、Java（`SHA256withECDSA`）等工具與函式庫預設用 **DER**；若你的函式庫預期 DER，需要把 64 位元組的 r‖s 轉成 DER，或改選 P1363 格式選項。
> `test-vectors/vectors.json` 內附同一份簽章的 DER 版本供對照。

C# 範例（完整版見 `samples/LicenseVerifier`）：

```csharp
using var ecdsa = ECDsa.Create();
ecdsa.ImportSubjectPublicKeyInfo(Convert.FromBase64String(spkiBase64), out _);
bool ok = signature.Length == 64 && ecdsa.VerifyData(payloadBytes, signature, HashAlgorithmName.SHA256);
```

### 6.2 啟動時的判斷

```
驗簽失敗 / kid 不認得 / product 不符           →  視為「沒有授權」，導向輸入序號
device_hash 與本機不符                          →  視為「沒有授權」（授權檔是別台的）
now 早於上次記錄的 server_time（容忍 5 分鐘）   →  時鐘倒轉：要求連線 /refresh
now ≤ lease_until                               →  有效，正常使用
now > lease_until 且 now ≤ valid_until          →  連線 /refresh（見 6.3）
now > valid_until                               →  連線 /refresh；通常會被拒絕，被拒就鎖定
```

每次收到新授權檔（啟用或續期）就把 `server_time` 另存一份，用來比較時鐘。建議在距離 `lease_until` 少於 7 天時就在背景呼叫 `/refresh`，使用者不會察覺。

### 6.3 租約到期與離線寬限（由軟體實作）

`now > lease_until` 時：

1. 嘗試 `/refresh`。成功 → 覆寫本機授權檔，繼續使用。
2. 伺服器**明確拒絕**（HTTP 4xx，`error` 為 `license_suspended`、`license_revoked`、`license_expired`、`not_eligible`、`device_not_allowed`、`invalid_license`）→ 清除本機授權、鎖定、顯示 `message`。
3. **連不上**（網路錯誤、逾時、5xx、429）→ **不要清除**。從 `lease_until` 起算 **7 天內**仍可使用，但每次啟動要顯示警告「請連線以更新授權」；超過 7 天要求連線。

完全沒有網路的電腦請走「離線啟用」流程，見 `離線授權.md`。

## 7. 錯誤

錯誤回應為 HTTP 4xx／5xx，body：

```json
{ "error": "seats_exceeded", "message": "席次已滿，請到會員中心停用不用的裝置" }
```

`error` 是固定代碼，`message` 是給人看的中文說明，可直接顯示給使用者。

| `error` | HTTP | 意義 | 建議行為 |
|---|---|---|---|
| `invalid_request` | 400 | 欄位缺漏或格式錯誤（如 `device_hash` 長度不符） | 修正程式 |
| `invalid_key` | 400／404 | 序號格式錯誤或不存在 | 提示重新輸入 |
| `invalid_license` | 400／401 | 授權檔格式錯誤或簽章無效 | 清除本機授權，要求重新啟用 |
| `not_eligible` | 403 | 會員目前不具資格（非企業需求端、審核未通過、帳號停用） | 顯示 `message`，引導至平台說明 |
| `seats_exceeded` | 409 | 席次已滿 | 提示到會員中心停用不用的裝置 |
| `license_expired` | 403 | 授權已過期 | 鎖定，引導至平台 |
| `license_suspended` | 403 | 授權暫停中 | 鎖定，聯絡客服 |
| `license_revoked` | 403 | 授權已撤銷 | 清除本機授權並鎖定 |
| `device_not_allowed` | 403 | 這台裝置未啟用或已被停用，或授權檔與裝置不符 | 清除本機授權，要求重新啟用 |
| `rate_limited` | 429 | 請求太頻繁（看 `Retry-After` 標頭，秒） | 稍後重試，勿立刻重送 |
| `service_unavailable` | 503 | 平台暫時無法簽發 | 當作連不上處理（§6.3 第 3 點） |

### 限流

- 每個來源 IP 每分鐘 30 次請求。
- 每個 IP 在 10 分鐘內輸入 10 個不存在的序號會被暫時封鎖。
- 每個序號每小時失敗超過 10 次會被暫時鎖定。
- 啟用失敗時伺服器會刻意延遲 0.25–0.6 秒，避免序號被枚舉。

一般使用（啟動時離線驗簽、數天一次 `/refresh`）遠低於上限。

## 8. device_hash 建議

- 由多個硬體因子（主機板、CPU、磁碟序號等，**不要只用 MAC**）組合後 SHA-256，格式建議 `sha256:<小寫 hex>`。
- 必須穩定：重開機、更新驅動、換網卡不應改變；建議容忍 1 個因子變動（在客戶端做模糊比對，但送給伺服器的值保持穩定）。
- 長度 8–200 字元。同一台裝置重複啟用要送相同的值，伺服器才不會多算席次。
- 不要把可識別個人的資料放進 `device_hash`；`device_name` 也只放電腦名稱之類的資訊。

## 9. 安全建議

1. **有價值的功能放伺服器端驗證授權**（例如訓練成績上傳、教材下載時帶授權檔供檢查），不要只靠客戶端一個 `if`；授權檢查散在多個功能點，不要集中成單一容易被修補的位置。
2. 公鑰內嵌在程式裡，不要只在執行時從網路取得就信任。
3. 不要在日誌輸出完整序號或授權檔。
4. 所有請求使用 HTTPS 並驗證憑證。
5. 授權檔本身有簽章，可放在使用者可寫的位置；但不要另外用明文旗標記錄「已授權」。

## 10. 快速測試（curl）

```bash
BASE=https://sps.isha.net/api/license/v1

# 取得公鑰
curl -s $BASE/public-keys

# 啟用（序號由平台另行提供）
curl -s -X POST $BASE/activate -H 'Content-Type: application/json' \
  -d '{"license_key":"XR-XXXX-XXXX-XXXX-XXXX","device_hash":"sha256:test-device-0001","device_name":"my-pc"}'

# 續期（把上一步回傳的 license 帶入）
curl -s -X POST $BASE/refresh -H 'Content-Type: application/json' \
  -d '{"license":"<授權檔>","device_hash":"sha256:test-device-0001"}'

# 停用
curl -s -X POST $BASE/deactivate -H 'Content-Type: application/json' \
  -d '{"license":"<授權檔>","device_hash":"sha256:test-device-0001"}'
```

## 11. 測試情境

測試序號與測試會員由平台另行提供（請勿外傳）。下列情境可請平台在後台調整測試授權後重現：

| 要測的情境 | 平台怎麼做 | 你應看到 |
|---|---|---|
| 席次已滿 | 預設席次 2；啟用第三台裝置 | `/activate` → `seats_exceeded` |
| 暫停 | 後台暫停授權 | `/refresh` → `license_suspended` |
| 撤銷 | 後台撤銷授權 | `/refresh` → `license_revoked` |
| 裝置被遠端停用 | 後台停用該裝置 | `/refresh` → `device_not_allowed` |
| 會員失去資格 | 調整測試會員身分 | `/refresh` → `not_eligible` |
| 租約到期 | 後台把租約天數調為 1 天 | 一天後觸發續期流程 |
| 序號失效 | 會員中心重新產生序號 | 舊序號 `/activate` → `invalid_key`（已啟用裝置不受影響） |

## 12. 版本異動

| 日期 | 版本 | 說明 |
|---|---|---|
| 2026-10-14 | 1.0 | 第一期線上授權：activate、refresh、deactivate、public-keys |
| 2026-10-14 | 1.1 | 第二期離線授權（見 `離線授權.md`）；授權檔 payload 新增 `mode`、`nonce` |

## 13. 聯絡窗口

（由平台填寫）
