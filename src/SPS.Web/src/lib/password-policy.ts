import type { PasswordPolicySettings } from "@/types/auth";

/**
 * 密碼策略（後台「系統設定 → 安全性 → 密碼策略」）在前台的共用邏輯。
 *
 * 策略的唯一來源是後端：`GET /api/Auth/password-policy`（公開），真正的檢查也在後端
 * （註冊申請、改密碼、重設密碼、公司成員新增與重設都會驗證）。這裡只是讓使用者在送出前就看到規則、
 * 少打一趟 API；規則長怎樣完全跟著後台設定走，不要在前台再寫死「至少 8 個字元」。
 *
 * 「不可重複使用前 N 組密碼」只有後端查得到歷史，前台只在提示文字裡告知，不做比對。
 */

/** 後端連不到時的備用值，跟後端 `PasswordPolicyDto` 的預設一致 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicySettings = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialCharacter: false,
  passwordHistoryCount: 0,
};

/** 特殊字元的定義要跟後端 `PasswordPolicyService` 的正規表示式一致 */
const SPECIAL_CHARACTER = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

/** 檢查密碼組成，回傳錯誤訊息；通過回傳 null。訊息格式跟後端相同（用「；」串起來） */
export function validatePasswordAgainstPolicy(password: string, policy: PasswordPolicySettings): string | null {
  const errors: string[] = [];
  if (password.length < policy.minLength) errors.push(`密碼長度至少需要 ${policy.minLength} 個字元`);
  if (policy.requireUppercase && !/[A-Z]/.test(password)) errors.push("密碼需包含至少一個大寫字母");
  if (policy.requireLowercase && !/[a-z]/.test(password)) errors.push("密碼需包含至少一個小寫字母");
  if (policy.requireDigit && !/\d/.test(password)) errors.push("密碼需包含至少一個數字");
  if (policy.requireSpecialCharacter && !SPECIAL_CHARACTER.test(password)) errors.push("密碼需包含至少一個特殊字元");
  return errors.length > 0 ? errors.join("；") : null;
}

/** 給欄位旁邊的提示文字，例如「至少 8 個字元，需包含大寫字母、小寫字母、數字」 */
export function describePasswordPolicy(policy: PasswordPolicySettings): string {
  const needs: string[] = [];
  if (policy.requireUppercase) needs.push("大寫字母");
  if (policy.requireLowercase) needs.push("小寫字母");
  if (policy.requireDigit) needs.push("數字");
  if (policy.requireSpecialCharacter) needs.push("特殊字元（如 ! @ # $ %）");

  let text = `至少 ${policy.minLength} 個字元`;
  if (needs.length > 0) text += `，需包含${needs.join("、")}`;
  if (policy.passwordHistoryCount > 0) text += `；不可與最近使用過的 ${policy.passwordHistoryCount} 組密碼相同`;
  return text;
}
