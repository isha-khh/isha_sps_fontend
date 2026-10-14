-- 在 SPS_dev（正式機資料庫的複本）上執行，**必須在 beta 後端第一次啟動之前**。
-- 複本裡有正式機的系統設定：信件（SMTP）、退信收信、ProTrack 整合都是啟用狀態，
-- 後端一啟動就會用它們對外寄信、收信、連線到正式的外部系統。這支腳本只關掉這三項，其他資料不動。
--
--   psql "host=10.19.80.11 dbname=SPS_dev user=<有權限的帳號>" -f sanitize-beta-db.sql
--
-- 只能對 SPS_dev 執行；下面第一段會確認連到的資料庫名稱，不是 SPS_dev 就中止。

\set ON_ERROR_STOP on

SELECT current_database() AS db;
DO $$
BEGIN
  IF current_database() <> 'SPS_dev' THEN
    RAISE EXCEPTION '目前連到的資料庫是 %，這支腳本只能在 SPS_dev 執行', current_database();
  END IF;
END $$;

BEGIN;

-- 1. 郵件服務停用（EmailSettingsDto.IsEnabled）：系統寄的所有信（會員通知、審核、回應、群發）都會被略過並記錄為「郵件服務已停用」
UPDATE "SystemSetting"
SET "Value" = jsonb_set("Value", '{IsEnabled}', 'false'::jsonb, true)
WHERE "Category" = 'Email';

-- 2. 退信收信停用（BounceMailSettingsDto.Enabled）：否則背景服務會用正式的信箱帳號去收信
UPDATE "SystemSetting"
SET "Value" = jsonb_set("Value", '{Enabled}', 'false'::jsonb, true)
WHERE "Category" = 'BounceMail';

-- 3. ProTrack 整合：清掉 API 金鑰（空值＝不呼叫），避免 beta 寫入正式的 ProTrack
UPDATE "SystemSetting"
SET "Value" = jsonb_set("Value", '{ApiKey}', '""'::jsonb, true)
WHERE "Category" = 'ProTrack';

-- 確認結果（每一列都應該是 false／空）：沒有出現的 Category 表示複本裡本來就沒有那項設定
SELECT "Category",
       "Value"->>'IsEnabled' AS email_is_enabled,
       "Value"->>'Enabled'   AS bounce_enabled,
       CASE WHEN "Category" = 'ProTrack' THEN ("Value"->>'ApiKey' = '') END AS protrack_key_cleared
FROM "SystemSetting"
WHERE "Category" IN ('Email', 'BounceMail', 'ProTrack')
ORDER BY "Category";

COMMIT;
