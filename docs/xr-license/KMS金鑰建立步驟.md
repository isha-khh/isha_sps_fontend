# Cloud KMS 簽章金鑰建立步驟（XR 授權）

授權檔由 **Google Cloud KMS 的非對稱金鑰**簽章，私鑰永遠不離開 KMS。後台「XR 授權 → 簽章金鑰」只登錄金鑰版本的資源名稱，系統會用服務帳號向 KMS 取回公鑰並檢查演算法。

**測試與正式各建一把**，互不相通：

| 環境 | 金鑰 | `kid` 建議 | 誰呼叫 KMS |
|---|---|---|---|
| 測試機 (sps.isha.net) | `xr-license-test` | `test-2026-10` | 服務帳號金鑰檔 (JSON)，用 `GOOGLE_APPLICATION_CREDENTIALS` 掛進後端容器 |
| 正式機 (GCP) | `xr-license-prod` | `prod-2026-10` | 正式機 VM 本身的服務帳號（不需金鑰檔） |

> 以下指令在 Cloud Shell 或已 `gcloud auth login` 的電腦執行。把 `<…>` 換成你的值。需要 Owner 或 `Cloud KMS Admin`、`Service Account Admin` 權限。

## 1. 變數與啟用 API

```bash
export PROJECT_ID=<你的 GCP 專案 ID>
export LOCATION=asia-east1          # 與正式機同區域較佳；金鑰建立後不能改區域
gcloud config set project $PROJECT_ID
gcloud services enable cloudkms.googleapis.com
```

## 2. 建立 Key Ring 與兩把金鑰

```bash
gcloud kms keyrings create sps-license --location=$LOCATION

# 測試用
gcloud kms keys create xr-license-test \
  --keyring=sps-license --location=$LOCATION \
  --purpose=asymmetric-signing \
  --default-algorithm=ec-sign-p256-sha256

# 正式用
gcloud kms keys create xr-license-prod \
  --keyring=sps-license --location=$LOCATION \
  --purpose=asymmetric-signing \
  --default-algorithm=ec-sign-p256-sha256
```

- 演算法必須是 `ec-sign-p256-sha256`（P-256 + SHA-256）。
- 預設保護等級是軟體；若合規要求 HSM，建立時加 `--protection-level=hsm`（費用較高）。
- 每把金鑰會自動有版本 `1`。

確認並取得公鑰（可選，用來對照後台登錄後顯示的公鑰）：

```bash
gcloud kms keys versions get-public-key 1 \
  --key=xr-license-test --keyring=sps-license --location=$LOCATION \
  --output-file=xr-license-test.pub.pem
```

## 3. 服務帳號與權限

**最小權限：每個環境的服務帳號只能用自己那把金鑰，且只有「簽章」與「讀公鑰」兩個角色。**

### 3.1 測試機

```bash
gcloud iam service-accounts create sps-license-test \
  --display-name="SPS XR license signer (test)"
export SA_TEST=sps-license-test@$PROJECT_ID.iam.gserviceaccount.com

gcloud kms keys add-iam-policy-binding xr-license-test \
  --keyring=sps-license --location=$LOCATION \
  --member="serviceAccount:$SA_TEST" --role="roles/cloudkms.signer"
gcloud kms keys add-iam-policy-binding xr-license-test \
  --keyring=sps-license --location=$LOCATION \
  --member="serviceAccount:$SA_TEST" --role="roles/cloudkms.publicKeyViewer"

# 產生金鑰檔（JSON）。這個檔等同於簽章權限，不要放進 git、不要貼到聊天或 issue
gcloud iam service-accounts keys create sps-license-test-sa.json --iam-account=$SA_TEST
```

### 3.2 正式機

正式機跑在 GCP 的 VM 上，直接使用 VM 掛載的服務帳號，**不需要金鑰檔**：

```bash
# 查 VM 使用的服務帳號
gcloud compute instances describe <VM 名稱> --zone=<zone> \
  --format="value(serviceAccounts[0].email)"
export SA_PROD=<上一行的結果>

gcloud kms keys add-iam-policy-binding xr-license-prod \
  --keyring=sps-license --location=$LOCATION \
  --member="serviceAccount:$SA_PROD" --role="roles/cloudkms.signer"
gcloud kms keys add-iam-policy-binding xr-license-prod \
  --keyring=sps-license --location=$LOCATION \
  --member="serviceAccount:$SA_PROD" --role="roles/cloudkms.publicKeyViewer"
```

> VM 的存取範圍 (access scopes) 需包含 `cloud-platform`，否則容器取得的憑證會被擋掉（沒有時 API 會回 403 `ACCESS_TOKEN_SCOPE_INSUFFICIENT`）。若 VM 是用預設範圍建立，需停機後修改範圍，或改用上面測試機那種金鑰檔方式。

## 4. 測試機：把金鑰檔掛進後端容器

1. 把 `sps-license-test-sa.json` 放到測試機（不在 git repo 內），例如 `/home/shareproject/SPS/secrets/sps-license-test-sa.json`，權限 `chmod 600`。
2. 後端服務（`docker-compose.dev.yml` 的 api）加上：

```yaml
    environment:
      GOOGLE_APPLICATION_CREDENTIALS: /run/secrets/gcp-kms.json
    volumes:
      - /home/shareproject/SPS/secrets/sps-license-test-sa.json:/run/secrets/gcp-kms.json:ro
```

3. 重新啟動 api 容器。後端使用 Application Default Credentials，會自動讀取這個檔。

> 容器內的使用者必須讀得到該檔（`chmod 644` 或調整擁有者）。若用 `600` 且擁有者是 root，非 root 的容器程序會讀不到。

## 5. 在後台登錄金鑰

1. 登入後台 → **服務專區 → 人才培育 → XR 簽章金鑰** → 「登錄金鑰」。
2. `kid`：測試機填 `test-2026-10`，正式機填 `prod-2026-10`（`test-`／`prod-` 前綴必須對應環境，廠商靠它辨識）。
3. KMS 金鑰版本資源名稱（注意結尾是 `cryptoKeyVersions/1`，不是金鑰本身）：

```
projects/<PROJECT_ID>/locations/asia-east1/keyRings/sps-license/cryptoKeys/xr-license-test/cryptoKeyVersions/1
```

4. 登錄成功 → 系統取回公鑰；若目前沒有 active 金鑰，這把直接成為 active（開始簽發）。
5. 把登錄後顯示的**公鑰**（後台「公鑰」按鈕）或 `GET /api/license/v1/public-keys` 的結果提供給廠商。

常見錯誤：
- `PERMISSION_DENIED`：服務帳號沒有 `cloudkms.signer`／`cloudkms.publicKeyViewer`，或權限綁在錯的金鑰。
- 演算法不符：金鑰不是 `ec-sign-p256-sha256`。
- 找不到憑證：測試機沒有設定 `GOOGLE_APPLICATION_CREDENTIALS` 或檔案路徑不對（看 api 容器日誌）。

## 6. 輪替（之後）

1. 在同一把 KMS 金鑰建立新版本（或建立新金鑰）：`gcloud kms keys versions create --key=… --keyring=… --location=…`。
2. 後台登錄新 `kid`（例如 `prod-2027-04`）→ 狀態「待命」→ 把公鑰提供給廠商並確認軟體已更新 → 後台「設為簽發」。舊金鑰自動變「退役中」，仍在公鑰清單，讓已簽發的授權在租約期間繼續可驗。
3. 所有裝置都續期換發後，將舊金鑰「退役」，再於 KMS 排程銷毀舊版本。

## 7. 安全注意

- 不要停用或銷毀正在使用的金鑰版本——所有已簽發授權將無法續期驗證。KMS 銷毀有 24 小時延遲，可在期間內還原。
- 服務帳號金鑰檔 (JSON) 只放在測試機，權限 600；不要提交到 git、不要貼到聊天。測試機重建時重新產生並撤銷舊金鑰：`gcloud iam service-accounts keys list/delete`。
- 測試與正式的服務帳號與金鑰分開，測試機的憑證外洩不影響正式環境。
