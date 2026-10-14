import { isAxiosError } from "axios";

/**
 * 從 axios 錯誤裡撈出後端真正的錯誤訊息，給表單顯示用。
 *
 * 這個專案的後端錯誤一律是 `BadRequest(new { error = "..." })`（見
 * `AuthController`／`VideoService` 等各支 Controller），body 統一長
 * `{ error: string }`——不是 axios 預設的 `error.message`（那個只會是
 * `"Request failed with status code 400"` 這種沒意義的通用字串）。
 * 沒對到這個形狀（網路斷線、CORS 擋掉等非後端回應的錯誤）才退回
 * `fallback`。
 */
export function getApiErrorMessage(error: unknown, fallback = "發生錯誤，請稍後再試"): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string; errors?: Record<string, string[] | string> } | undefined;
    if (typeof data?.error === "string" && data.error) return data.error;
    if (typeof data?.message === "string" && data.message) return data.message;
    // ASP.NET 模型驗證失敗（DataAnnotations，例如「密碼長度不能少於8位」）回的是 ProblemDetails：
    // `{ title: "One or more validation errors occurred.", errors: { "欄位": ["訊息"] } }`，取第一則訊息
    if (data?.errors && typeof data.errors === "object") {
      for (const messages of Object.values(data.errors)) {
        const first = Array.isArray(messages) ? messages[0] : messages;
        if (typeof first === "string" && first) return first;
      }
    }
  }
  return fallback;
}
