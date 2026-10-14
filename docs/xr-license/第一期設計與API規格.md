# XR 軟體授權驗證：第一期設計與 API 規格（草案）

2026-10-14：第一期已實作（後端、後台、會員中心；DB 流程尚待測試機驗證）。本文是設計依據，**實作細節以程式與 `vendor/` 內的對外文件為準**（例如限流數字、錯誤的 HTTP 狀態碼）。來源：`https://hackmd.io/@foylaou/rk0kJb5sMe`（桌面軟體授權設計）。

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
（已確認：**同時是需求端與供給端的企業算有資格**——只要有需求端身分就算。）

## 3. 設計重點（沿用文件的核心）

- 授權檔由伺服器**私鑰簽章**（ECDSA P-256 + SHA-256），客戶端只用**內嵌公鑰**驗證。私鑰不進程式、不進 git、不放資料庫。
- 線上優先；`valid_until`（有沒有權利使用）與 `lease_until`（多久要回來確認一次）雙時間。
- 資格跟著會員狀態走：伺服器在每次 activate／refresh 時查會員，不另外維護一份會失效的名單。
- 第一期做**線上**；**離線啟用／離線停用碼已確認需要**，排在第二期（見第 10 節）；試用、金流 webhook 不做。

### 預設值（待確認）

| 項目 | 預設 |
|---|---|
| 席次 | **後台動態設定**：系統設定有「預設席次」（初始 2），每份授權可個別覆寫；會員中心與授權檔都顯示該份授權目前的席次。調整後立即生效於新的啟用，已啟用的裝置不會被踢掉（席次降到低於已啟用數時，只是不能再啟用新裝置） |
| `lease_days` | 30 天 |
| 離線寬限期 | 7 天（由客戶端執行：lease 過期後仍連不上伺服器時，警告後可再使用 7 天） |
| `valid_until` | 會員資格有效期間內滾動延長（每次續期等於 `lease_until`，第一期不做另外的購買期限） |
| 簽章金鑰 | GCP Cloud KMS 非對稱簽章（EC_SIGN_P256_SHA256），後台登錄與管理（見第 9 節；不提供上傳私鑰） |

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

限流（第一期，實作值）：每 IP 每分鐘 30 次、每 IP 10 分鐘內 10 次不存在序號、每序號每小時 10 次**失敗**，超過回 429；失敗回應刻意延遲，避免序號枚舉。

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

## 9. 簽章金鑰管理（後台「XR 授權 → 簽章金鑰」）

**只做「登錄 Cloud KMS 金鑰」，不提供上傳私鑰**（私鑰是整個授權系統唯一的信任根，不經過網頁、不存資料庫）：

1. 你在 GCP 建好 KMS 金鑰（演算法 `EC_SIGN_P256_SHA256`，用途「非對稱簽章」），並讓後端的服務帳號有 `Cloud KMS CryptoKey Signer` 與 `Cloud KMS Public Key Viewer` 權限。
2. 後台貼上**金鑰版本**的資源名稱（`projects/…/locations/…/keyRings/…/cryptoKeys/…/cryptoKeyVersions/N`）與 `kid`（例如 `prod-2026-10`）。
3. 後端用服務帳號向 KMS 取回**公鑰**並檢查演算法；通過才登錄。之後簽章由 KMS 完成，私鑰永遠不離開 KMS。
4. 後台可管理：狀態（active／retiring／retired）、`not_after`、備註；可下載公鑰給廠商。同一時間只能有一把 active 金鑰用來簽發新授權；retiring 的公鑰仍會出現在公開公鑰端點，讓已簽發的授權在 lease 期間仍能驗證。
5. **測試機與正式機各用自己的 KMS 金鑰**（`test-…` 與 `prod-…`），兩個環境的簽章互不相通；測試機要能呼叫 KMS，需要把有上述權限的服務帳號金鑰（JSON）以環境變數 `GOOGLE_APPLICATION_CREDENTIALS` 掛進後端容器（正式機在 GCP 上，直接使用 VM 的服務帳號即可）。

## 10. 權限、稽核與安全

- 後台新增權限位元 `ManageLicenses`（沿用現有 RBAC，`[RequirePermission]`），預設只給超級管理員與指定角色。
- 所有後台動作與每次 activate／refresh／deactivate 都寫 `LicenseEvents`（只新增）。
- 簽章服務是介面（`ILicenseSigner`）：Cloud KMS 實作與本機 PEM 實作；`kid` 對應 KMS 金鑰版本。金鑰輪替第一期只做資料結構與公鑰端點，輪替管理畫面放第二期。
- 序號不寫入日誌；日誌記錄遮罩版本。

## 11. 分期

| 期別 | 內容 |
|---|---|
| **第一期（線上）** | 資料表＋遷移、簽章服務（Cloud KMS）、activate／refresh／deactivate／public-keys、資格判斷、動態席次、會員中心「XR 授權」頁、後台授權管理與簽章金鑰管理、稽核、限流、**給廠商的整合包（見第 13 節）**、測試環境上線 |
| **第二期（離線＋補強）**（離線部分已實作 2026-10-14，見 `vendor/離線授權.md`；裝置綁定金鑰、異常偵測尚未做） | **離線啟用**（`.req` 請求檔 → 會員中心／後台簽發 `.lic`）、**離線停用碼**、離線授權的較長 lease（預設 90 天）與重簽發、裝置綁定金鑰與 challenge、`server_time` 校正強化、異常偵測與通知 |
| 第三期（視需要） | 金鑰輪替管理畫面強化、整家公司共用席次、試用、其他 |

離線啟用的流程沿用 HackMD 第 6.4、6.5 節：離線電腦產生 `.req`（序號、device_hash、軟體版本、nonce）→ 在有網路的電腦上傳到平台 → 簽出綁定該 nonce 的 `.lic` → 帶回匯入；停用時由舊機器產生停用憑證，上傳後才釋放席次。`nonce` 一次性、15 分鐘有效。

## 12. 環境與金鑰（測試機先整合，正式機再切換）

| 環境 | 網址 | 簽章金鑰 `kid` | 說明 |
|---|---|---|---|
| 測試機 | `https://sps.isha.net/api/license/v1`（SPS 測試環境） | `test-…`（測試用的 Cloud KMS 金鑰） | 廠商先在這裡整合；測試用的假會員與測試序號由我們提供 |
| 正式機 | 正式站網域 `…/api/license/v1`（上線時確定） | `prod-…`（Cloud KMS） | 廠商之後切換到這裡驗證 |

- **endpoint 路徑與請求格式在兩個環境完全相同**，廠商程式只需要把「伺服器基底網址」與「公鑰」做成可設定，切換環境不必改程式。
- **廠商的程式請同時內嵌「測試」與「正式」兩把公鑰（依授權檔的 `kid` 選用）**；授權檔本身就說明它是哪個環境簽的，測試授權在正式環境驗不過、反過來也一樣。
- 我們**保留**這組 endpoint 與金鑰設定：測試機的金鑰與端點在廠商整合期間不更換；正式機的金鑰在你建好 KMS 金鑰、登錄後即固定，之後只做輪替（新增 `kid`，舊的保留到過渡期結束）。

## 13. 給廠商的整合包

第一期完成時一併提供（也可以先給草案讓廠商提前準備）：
1. **整合指南**（中文）：流程、授權檔格式、驗簽步驟、錯誤處理、離線預告、安全建議。
2. **API 文件**：OpenAPI 3 規格檔（可匯入 Postman／Swagger UI）與可直接測的測試機網址。
3. **C# 驗簽範例**（含 DER／P1363 說明）與**測試向量**（固定的測試公鑰、授權檔、預期結果）。
4. **測試環境資料**：測試公鑰、測試序號、測試用的錯誤情境（過期、撤銷、席次滿）怎麼觸發。
5. 聯絡窗口與版本異動紀錄。

## 14. 已確認事項與待辦

已確認（2026-10-14）：席次由後台動態設定（全域預設＋每份授權個別覆寫，「依公司設定」之後再說）、需要離線（第二期）、需求端與供給端皆有的企業算有資格、**金鑰只做 Cloud KMS 登錄（不上傳私鑰）**、廠商先在測試機整合、正式機之後驗證、需要 API 文件。

待辦（由使用者）：
1. 在 GCP 建立 Cloud KMS 金鑰：測試用與正式用各一把，演算法 EC_SIGN_P256_SHA256；步驟與指令見 `KMS金鑰建立步驟.md`。
2. 把簽章與讀公鑰的權限授予後端服務帳號；測試機要提供服務帳號金鑰檔（JSON）給後端容器。

## 15. 第二期離線授權：實作決定（2026-10-14）

與上面第 11 節的差異與補充：

- **流程**：離線電腦產生 `.req`（base64url JSON：序號、device_hash、device_name、client_version、nonce、created_at）→ 會員在**會員中心**（需登入）上傳 → 後端簽發離線授權檔（與線上同格式，payload 新增 `mode`／`nonce`）→ 帶回匯入並比對 nonce。**沒有新的匿名 API**。
- **離線租約**：全域設定 `OfflineLeaseDays`（預設 90，1–365），不受單份授權的 `LeaseDaysOverride` 影響；離線電腦沒有寬限期，到期就要換發。後台可關閉整個離線功能（`OfflineEnabled`）。
- **請求檔有效期 24 小時**（原 HackMD 寫 15 分鐘）：離線電腦要把檔案帶到有網路的電腦，15 分鐘太緊；一次性 nonce 才是防重放的主力（`LicenseOfflineNonces` 表，主鍵唯一，與簽發同一個交易）。離線電腦時鐘比伺服器快超過 10 分鐘會被拒絕。
- **續期＝重新上傳新的 .req**（新 nonce）：同一台裝置（相同 device_hash）視為換發，不多佔席次。
- **離線停用**：`.deact` 內含目前的授權檔（證明持有），會員上傳後釋放席次。**離線裝置在會員中心不能直接「停用」**（否則可保留舊機授權檔再到新機啟用）；遺失或損壞的電腦由管理員從後台停用。
- **殘餘風險**：停用憑證沒有裝置綁定私鑰，只證明「持有授權檔」；離線授權撤銷最慢在 `lease_until` 後生效。裝置綁定金鑰（HackMD 12.3）、異常偵測、金鑰輪替管理畫面仍未做。
