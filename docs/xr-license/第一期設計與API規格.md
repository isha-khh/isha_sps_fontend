# XR 軟體授權驗證：第一期設計與 API 規格（草案）

2026-10-14 草案，**尚未實作**，待確認。來源：`https://hackmd.io/@foylaou/rk0kJb5sMe`（桌面軟體授權設計）。

## 1. 範圍與分工

| 項目 | 誰負責 |
|---|---|
| XR 軟體本體、打包、安裝程式、啟動時呼叫驗證、驗簽、本機保存授權檔 | **廠商** |
| 授權伺服器（簽發、續期、停用、撤銷）、會員資格判斷、會員中心「XR 授權」頁、後台授權管理、稽核紀錄、**給廠商的 API 規格與驗簽範例** | **我們（平台）** |
| 安裝檔下載 | 維持公開（後台「頁面設定 → 下載資源」的外部連結），不需要登入 |

**限制的是「使用」不是「下載」**：沒有有效授權，軟體不能執行（由廠商端依本規格實作）。

## 2. 誰有資格

只有同時符合下列條件的會員才發給授權，**每次續期都重新檢查**：

1. 企業會員（有所屬公司）。
2. 角色為**需求端**（`MemberRole.Buyer`）。
3. 申請已審核通過、帳號未停用、公司未停用。

任何一項不符：啟用回 `not_eligible`；已發出的授權在下次續期被拒（`license_suspended`／`license_revoked`），最長延遲為 `lease_days`。
（待確認：同時是需求端與供給端的企業，預設「有需求端身分就算」。）

## 3. 設計重點（沿用文件的核心）

- 授權檔由伺服器**私鑰簽章**（ECDSA P-256 + SHA-256），客戶端只用**內嵌公鑰**驗證。私鑰不進程式、不進 git、不放資料庫。
- 線上優先；`valid_until`（有沒有權利使用）與 `lease_until`（多久要回來確認一次）雙時間。
- 資格跟著會員狀態走：伺服器在每次 activate／refresh 時查會員，不另外維護一份會失效的名單。
- 第一期只做**線上**；離線請求檔、試用、金流 webhook 不在第一期。

### 預設值（待確認）

| 項目 | 預設 |
|---|---|
| 席次 | 每位需求端會員 2 個裝置（待確認：或整家公司共用 N 席） |
| `lease_days` | 30 天 |
| 離線寬限期 | 7 天（由客戶端執行：lease 過期後仍連不上伺服器時，警告後可再使用 7 天） |
| `valid_until` | 會員資格有效期間內滾動延長（每次續期等於 `lease_until`，第一期不做另外的購買期限） |
| 簽章金鑰 | GCP Cloud KMS 非對稱簽章（EC_SIGN_P256_SHA256）；開發／測試環境可用 PEM 金鑰（由機密管理注入） |

## 4. 資料表（PostgreSQL，EF Core migration）

| 表 | 欄位（重點） |
|---|---|
| `Licenses` | `Id`(uuid)、`ProductCode`（`xr`）、`LicenseKey`（唯一，顯示給會員的序號）、`MemberId`、`CompanyId?`、`Seats`、`Status`（active／suspended／revoked／expired）、`ValidUntil`、`LeaseDays`、`Notes`、`CreatedTime`、`UpdatedTime` |
| `LicenseActivations` | `Id`、`LicenseId`、`DeviceHash`、`DeviceName`、`DevicePublicKey?`（第二期）、`Status`（active／deactivated／revoked）、`ActivationMode`（online）、`FirstActivatedAt`、`LastSeenAt`、`LastIp`；唯一鍵 `(LicenseId, DeviceHash)` |
| `LicenseEvents`（只新增） | `Id`、`LicenseId?`、`ActivationId?`、`EventType`（activated／refreshed／refresh_denied／deactivated／suspended／revoked／extended／key_regenerated／admin_*…）、`Actor`（member:id／admin:id／system）、`Detail`(jsonb)、`At`、`Ip` |
| `LicenseSigningKeys` | `Kid`（PK）、`PublicKey`（SPKI base64）、`Status`（active／retiring／retired）、`NotAfter?`、`CreatedTime`。**只存公鑰與狀態** |

序號（`LicenseKey`）：16 字元 Crockford Base32（80 bit），顯示成 `XR-XXXX-XXXX-XXXX-XXXX`，伺服器只存雜湊＋顯示用的遮罩版本（明文只在產生當下顯示給會員一次；會員中心可「重新產生」，舊序號立即失效）。

## 5. 授權檔格式

`base64url(payload).base64url(signature)`；payload 是 UTF-8 JSON：

```json
{
  "kid": "2026-10",
  "license_id": "b7c1d3f0-....",
  "product": "xr",
  "customer": "公司名稱",
  "member_id": "會員識別（不含個資）",
  "edition": "standard",
  "features": [],
  "seats": 2,
  "device_hash": "sha256:9f2a...",
  "issued_at": "2026-10-20T00:00:00Z",
  "valid_until": "2026-11-19T00:00:00Z",
  "lease_until": "2026-11-19T00:00:00Z",
  "server_time": "2026-10-20T00:00:00Z"
}
```

- 簽章：ECDSA P-256 + SHA-256，簽的是 **payload 的原始位元組**（base64url 解碼後那段，不要重新序列化）。
- **簽章編碼採 IEEE P1363（r‖s，64 位元組）**。注意：Cloud KMS 回傳的是 DER，伺服器簽章服務會轉成 P1363 再輸出；廠商用 .NET 驗證時用預設的 `ecdsa.VerifyData(payload, sig, HashAlgorithmName.SHA256)` 即可（若改用 DER 要指定 `DSASignatureFormat.Rfc3279DerSequence`）。
- `customer`、`member_id` 只放必要識別，**不放 email、電話等個資**。

## 6. API（給廠商；皆為 HTTPS、JSON，不使用 cookie）

基底路徑 `/api/license/v1`。這幾支是**匿名端點**（客戶端是桌面程式，沒有登入 cookie；身分由序號／既有授權檔證明），需要豁免 CSRF，並做限流。

| 端點 | 請求 | 成功回應 |
|---|---|---|
| `POST /activate` | `{ "license_key", "device_hash", "device_name", "client_version" }` | `{ "license": "<授權檔>", "server_time" }` |
| `POST /refresh` | `{ "license": "<舊授權檔>", "device_hash", "client_version" }` | `{ "license": "<新授權檔>", "server_time" }` |
| `POST /deactivate` | `{ "license": "<授權檔>", "device_hash" }` | `{ "ok": true }`（釋放席次） |
| `GET /public-keys` | — | `{ "keys": [ { "kid", "alg": "ES256", "spki": "<base64>", "status", "not_after" } ] }` |

錯誤回應（HTTP 4xx，`{ "error": "<代碼>", "message": "<給人看的訊息>" }`）：

| `error` | 意義 | 建議的客戶端行為 |
|---|---|---|
| `invalid_key` | 序號不存在或格式錯誤 | 提示重新輸入 |
| `not_eligible` | 會員目前不具資格（非需求端企業會員、未審核、停用） | 引導至平台說明 |
| `seats_exceeded` | 席次已滿 | 引導至會員中心停用舊裝置 |
| `license_expired` | 授權過期 | 引導至平台 |
| `license_suspended` | 暫停中 | 聯絡客服 |
| `license_revoked` | 已撤銷 | 清除本機授權、鎖定 |
| `device_not_allowed` | 裝置未啟用或已被停用 | 重新啟用 |
| `rate_limited` | 請求太頻繁（429） | 稍後重試 |

限流（第一期）：每 IP 每分鐘 20 次、每序號每小時 10 次**失敗**，超過回 429；失敗回應刻意延遲，避免序號枚舉。

## 7. 廠商端的驗證流程（規格）

1. 啟動：讀本機授權檔 → 用**內嵌公鑰**（依 `kid` 選）驗簽章 → `device_hash` 要等於本機。
2. 時間：`now` 小於上次記錄的 `server_time` → 視為時鐘倒轉，要求連線續期。
3. `now > lease_until`：連線呼叫 `/refresh`；成功就覆寫本機檔；被拒（`license_*`／`device_not_allowed`）就清除授權並鎖定；連不上則在 7 天寬限期內警告後可使用，超過就要求連線。
4. 距 `lease_until` 少於 7 天時，背景呼叫 `/refresh`。
5. **有價值的功能請放伺服器端驗證授權**（例如訓練成績上傳、教材下載），不要只靠客戶端的一個 `if`；授權檢查分散在多個功能點。
6. `device_hash`：由廠商組合多個硬體因子（不要只用 MAC）後 SHA-256，建議容忍 1 個因子變動；本規格只要求它是穩定的字串。

我們會提供：**範例 C# 驗簽程式**、**測試環境網址**、**測試用公鑰**、一組**測試序號**（測試環境的假會員），以及簽章測試向量。

## 8. 畫面

**會員中心「XR 授權」**（新分頁，只有具資格的會員看得到；其他會員顯示「XR 僅提供企業需求端會員使用」）
- 授權狀態、序號（遮罩，可複製；「重新產生」會讓舊序號立即失效）、席次使用量、有效期限。
- 已啟用的裝置清單（名稱、首次啟用、最後上線、狀態）、每台可「停用」釋放席次。
- 下載安裝檔的連結（沿用「頁面設定 → 下載資源」的 XR 連結）。

**後台「XR 授權」**（新權限，見第 9 節）
- 列表：搜尋（公司、會員、序號後四碼）、狀態篩選。
- 詳情：授權資料、裝置清單（可遠端停用）、事件紀錄；動作：暫停、恢復、撤銷（填原因）、調整席次、重新產生序號。

## 9. 權限、稽核與安全

- 後台新增權限位元 `ManageLicenses`（沿用現有 RBAC，`[RequirePermission]`），預設只給超級管理員與指定角色。
- 所有後台動作與每次 activate／refresh／deactivate 都寫 `LicenseEvents`（只新增）。
- 簽章服務是介面（`ILicenseSigner`）：Cloud KMS 實作與本機 PEM 實作；`kid` 對應 KMS 金鑰版本。金鑰輪替第一期只做資料結構與公鑰端點，輪替管理畫面放第二期。
- 序號不寫入日誌；日誌記錄遮罩版本。

## 10. 分期

| 期別 | 內容 |
|---|---|
| **第一期（本文件）** | 資料表＋遷移、簽章服務、activate／refresh／deactivate／public-keys、資格判斷、會員中心頁、後台管理、稽核、限流、給廠商的規格與 C# 驗簽範例、測試環境 |
| 第二期 | 裝置綁定金鑰與 challenge、`server_time` 校正強化、異常偵測與通知、金鑰輪替管理、整家公司共用席次（若需要） |
| 第三期 | 離線請求檔與離線停用碼、試用、其他 |

## 11. 待確認

1. 席次：每位會員 2 個？或整家公司共用 N 席？
2. 是否需要離線（影響第二、三期的排程，不影響第一期）。
3. 同時是需求端與供給端的企業是否算有資格。
4. 簽章金鑰：能否在 GCP 建立 Cloud KMS 金鑰（需要 `Cloud KMS CryptoKey Signer` 權限給後端的服務帳號）？
5. 廠商是否能在測試環境先行整合（我們提供測試網址、公鑰、測試序號）。
