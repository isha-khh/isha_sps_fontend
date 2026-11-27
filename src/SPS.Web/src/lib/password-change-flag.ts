/**
 * 「用密碼登入後必須先改密碼」的暫存旗標（後台要求會員改密碼、密碼已過期時，登入回應會帶 `requirePasswordChange`）。
 *
 * 為什麼存在 sessionStorage 而不是看會員資料：要不要改密碼只跟「這次是用密碼登入」有關，Passkey 登入沒有用到密碼，
 * 不需要改，所以只有密碼登入才設這個旗標；重新整理頁面、換分頁（同一個瀏覽器分頁內）還在，改完密碼或登出就清掉。
 * 這是前端的導引，真正的密碼規則與是否改成功由後端決定。
 */
const KEY = "sps-password-change-required";

export function getPasswordChangeReason(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setPasswordChangeReason(reason: string): void {
  try {
    window.sessionStorage.setItem(KEY, reason || "請先修改密碼");
  } catch {
    // 瀏覽器擋掉 sessionStorage 時就沒辦法記住，登入當下的導向仍然有效
  }
}

export function clearPasswordChangeReason(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // 同上
  }
}
