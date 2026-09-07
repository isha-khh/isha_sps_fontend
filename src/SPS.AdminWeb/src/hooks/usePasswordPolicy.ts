import { useState, useEffect, useCallback } from 'react';
import { adminAuthApi } from '@/lib/api/admin-auth';
import type { PasswordPolicySettings } from '@/types/settings';

const defaultPolicy: PasswordPolicySettings = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialCharacter: false,
  passwordHistoryCount: 0,
};

export function usePasswordPolicy() {
  const [policy, setPolicy] = useState<PasswordPolicySettings>(defaultPolicy);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminAuthApi.getPasswordPolicy()
      .then(setPolicy)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  /** 驗證密碼是否符合策略，回傳錯誤訊息陣列（空陣列表示通過） */
  const validate = useCallback((password: string): string[] => {
    const errors: string[] = [];
    if (password.length < policy.minLength)
      errors.push(`密碼長度至少需要 ${policy.minLength} 個字元`);
    if (policy.requireUppercase && !/[A-Z]/.test(password))
      errors.push('需包含至少一個大寫字母');
    if (policy.requireLowercase && !/[a-z]/.test(password))
      errors.push('需包含至少一個小寫字母');
    if (policy.requireDigit && !/\d/.test(password))
      errors.push('需包含至少一個數字');
    if (policy.requireSpecialCharacter && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
      errors.push('需包含至少一個特殊字元');
    return errors;
  }, [policy]);

  /** 密碼策略的文字描述（用於 UI 提示） */
  const policyHints: string[] = [];
  policyHints.push(`至少 ${policy.minLength} 個字元`);
  if (policy.requireUppercase) policyHints.push('大寫字母');
  if (policy.requireLowercase) policyHints.push('小寫字母');
  if (policy.requireDigit) policyHints.push('數字');
  if (policy.requireSpecialCharacter) policyHints.push('特殊字元');

  return {
    policy,
    isLoading,
    validate,
    /** 密碼欄位 placeholder */
    placeholder: `請輸入密碼（至少 ${policy.minLength} 個字元）`,
    /** 密碼策略提示文字 */
    policyHints,
    /** 密碼策略摘要文字 */
    policySummary: `密碼需包含：${policyHints.join('、')}`,
  };
}
