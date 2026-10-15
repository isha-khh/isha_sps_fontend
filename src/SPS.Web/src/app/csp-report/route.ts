/**
 * CSP 違規回報接收端（`/sps/csp-report`）。
 *
 * 前台的 `Content-Security-Policy-Report-Only` 標頭（見 next.config.ts）帶 `report-uri /csp-report`：
 * 瀏覽器發現頁面載入了「不在白名單內」的資源（腳本、圖片、iframe…）時，會在不擋下資源的情況下把違規資訊 POST 到這裡。
 * 這裡只把一行精簡的摘要寫到伺服器日誌（`docker logs`），用來在正式啟用 CSP 之前找出還需要放行的來源。
 *
 * 防濫用：任何人都能 POST，所以限制內容大小，並且每分鐘最多記錄 `MAX_LOGS_PER_MINUTE` 筆，其餘直接丟掉；永遠回 204。
 */
const MAX_BODY_BYTES = 8 * 1024;
const MAX_LOGS_PER_MINUTE = 60;

let windowStart = 0;
let logged = 0;

function allowLog(now: number): boolean {
  if (now - windowStart > 60_000) {
    windowStart = now;
    logged = 0;
  }
  logged += 1;
  return logged <= MAX_LOGS_PER_MINUTE;
}

const clip = (value: unknown, max = 200): string => (typeof value === "string" ? value.slice(0, max) : "");

export async function POST(request: Request) {
  try {
    const text = (await request.text()).slice(0, MAX_BODY_BYTES);
    if (allowLog(Date.now())) {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      // 舊格式（report-uri）：{ "csp-report": {...} }；Reporting API：[{ type, body: {...} }]
      const first = Array.isArray(parsed) ? (parsed[0] as { body?: Record<string, unknown> } | undefined)?.body : (parsed["csp-report"] as Record<string, unknown> | undefined);
      if (first) {
        console.warn(
          "[csp-report]",
          JSON.stringify({
            directive: clip(first["violated-directive"] ?? first["effectiveDirective"]),
            blocked: clip(first["blocked-uri"] ?? first["blockedURL"]),
            page: clip(first["document-uri"] ?? first["documentURL"]),
            source: clip(first["source-file"] ?? first["sourceFile"]),
            line: first["line-number"] ?? first["lineNumber"],
            sample: clip(first["script-sample"] ?? first["sample"], 80),
          }),
        );
      }
    }
  } catch {
    // 內容不是合法 JSON 就略過，不要因為垃圾資料產生錯誤日誌
  }
  return new Response(null, { status: 204 });
}
