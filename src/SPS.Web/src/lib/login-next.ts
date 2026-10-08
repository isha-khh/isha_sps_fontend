/**
 * 登入後要回去的頁面（`/member/login?next=/matching/5`）。只接受站內路徑（以單一 `/` 開頭），
 * 避免被拿來做開放式重導（`//evil.com`、`https://…`、`/\evil.com` 都擋掉）。路徑不含 basePath，由 router 自己補。
 */
export function getSafeNext(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("\n") || raw.includes("\r")) return null;
  return raw;
}

/** 目前網址上的 `?next=`（只能在瀏覽器端呼叫）；沒有或不安全就回 null */
export function readNextFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return getSafeNext(new URLSearchParams(window.location.search).get("next"));
}

/** 登入頁網址：帶上目前頁面，登入完成後回來 */
export function loginHref(next?: string | null): string {
  const safe = getSafeNext(next);
  return safe ? `/member/login?next=${encodeURIComponent(safe)}` : "/member/login";
}
