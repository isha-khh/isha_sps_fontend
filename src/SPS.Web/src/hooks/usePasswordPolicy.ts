"use client";

import { useCallback, useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import {
  DEFAULT_PASSWORD_POLICY,
  describePasswordPolicy,
  validatePasswordAgainstPolicy,
} from "@/lib/password-policy";
import type { PasswordPolicySettings } from "@/types/auth";

// 同一個分頁裡，多個表單、多次開關都共用同一次請求；後台改設定後重新整理頁面就會拿到新的
let cached: Promise<PasswordPolicySettings> | null = null;

function loadPolicy(): Promise<PasswordPolicySettings> {
  if (!cached) {
    cached = authApi.getPasswordPolicy().catch(() => {
      cached = null; // 失敗不要永遠記住，下次再試
      return DEFAULT_PASSWORD_POLICY;
    });
  }
  return cached;
}

/**
 * 取得後台設定的密碼策略（長度、大小寫、數字、特殊字元、不可重複前 N 組），
 * 提供送出前的檢查與欄位旁的提示文字。還沒載入完成或連不到後端時先用預設值，
 * 反正最後一關是後端的檢查，訊息會直接顯示出來。
 */
export function usePasswordPolicy() {
  const [policy, setPolicy] = useState<PasswordPolicySettings>(DEFAULT_PASSWORD_POLICY);

  useEffect(() => {
    let active = true;
    void loadPolicy().then((p) => {
      if (active) setPolicy(p);
    });
    return () => {
      active = false;
    };
  }, []);

  /** 密碼不符合策略時回傳說明，符合回傳 null */
  const validate = useCallback((password: string) => validatePasswordAgainstPolicy(password, policy), [policy]);

  return { policy, validate, hint: describePasswordPolicy(policy) };
}
