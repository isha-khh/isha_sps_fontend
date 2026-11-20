/**
 * 內容編輯規則檢查（無障礙檢測 HM1130104E 標題層級、HM1110100E 圖片替代文字、連結文字）。
 *
 * Puck 只能限制「某個欄位能選什麼」，管不到「區塊之間的順序」與「整篇內容」的規則，所以另外寫一支純函式：
 * 輸入 Puck 存下來的資料（`{ content: [{ type, props }] }`，或它的 JSON 字串），輸出問題清單。
 * 沒有 React、沒有 DOM 依賴，之後要加規則只要在這裡加，不用動編輯器。
 *
 * 用在兩個地方：
 * - `PuckEditor`：每次編輯重新檢查，在編輯器標題列顯示問題數量與清單（只提醒，不擋編輯）。
 * - 各表單頁「發布」時（`guardPublish`）：有「錯誤」就不讓發布並列出問題；「警告」只提示、仍可發布。草稿一律可存。
 *
 * 判斷標題層級時假設**文章頁自己的標題是 H2**（前台詳細頁標題都是 H2，見前台 `news/[id]/page.tsx` 等），
 * 所以內容裡第一個標題最高只能到 H3 往下一級以內：H2 或 H3 都可以，H4 以上就是跳級。
 * 富文字欄位（文章內容、圖片區塊說明…）裡的標題不在這裡檢查：前台顯示時會依相對結構重排成不跳級
 * （前台 `RichTextContent` 的 `normalizeHeadingLevels`），這裡只檢查「區塊自己輸出的標題」。
 */

export type ContentIssueLevel = "error" | "warning";

export interface ContentIssue {
  level: ContentIssueLevel;
  /** 第幾個區塊（從 1 算起，跟編輯器左側大綱的順序一致） */
  blockNumber: number;
  /** 區塊的中文名稱 */
  blockLabel: string;
  message: string;
}

interface PuckBlock {
  type?: string;
  props?: Record<string, unknown>;
}

/** 文章頁標題的層級：內容裡的標題要從它往下接 */
const PAGE_TITLE_LEVEL = 2;

const BLOCK_LABELS: Record<string, string> = {
  HeroBlock: "標題區塊",
  FeatureList: "特色清單",
  CallToAction: "行動呼籲",
  FileDownloads: "附件下載",
  RelatedLinks: "相關連結",
  ContactInfo: "聯絡資訊",
  ImageFeature: "圖片區塊",
  NavigationCard: "導覽卡片",
  ArticleContent: "文章內容",
};

/** 舊版圖片區塊的預設替代文字，沒改就存的內容會被檢測退件 */
const SAMPLE_ALT = "這是一張範例圖片";

/**
 * 編輯器元件的預設範例文字：內容裡還留著這些字，代表編輯者沒把範例改成真正的內容就發布了（錯誤）。
 * 掃區塊裡所有文字欄位，不分欄位。要跟後端 ArticleContentRules.cs 的 PlaceholderKeywords 同步。
 */
const PLACEHOLDER_KEYWORDS = [SAMPLE_ALT];

/** 這個值底下（含巢狀的物件、陣列）有沒有任何字串包含指定文字 */
function containsText(value: unknown, text: string): boolean {
  if (typeof value === "string") return value.includes(text);
  if (Array.isArray(value)) return value.some((item) => containsText(item, text));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsText(item, text));
  return false;
}

/** 看不出連結目的的文字（無障礙檢測：連結文字要能單獨說明去哪裡） */
const GENERIC_LINK_TEXTS = new Set(["點此", "點擊此處", "點擊這裡", "這裡", "此處", "更多", "詳情", "click here", "here", "more", "read more"]);

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function labelOf(block: PuckBlock): string {
  return BLOCK_LABELS[block.type ?? ""] ?? block.type ?? "區塊";
}

/** 這個區塊會輸出哪些「自己的標題」（層級依出現順序）；沒填標題的不輸出（前台也不會輸出空標題） */
function headingsOf(block: PuckBlock): number[] {
  const props = block.props ?? {};
  const levelOf = (value: unknown, fallback: number) => {
    const match = typeof value === "string" ? /^h([1-6])$/i.exec(value) : null;
    return match ? Number(match[1]) : fallback;
  };

  switch (block.type) {
    case "HeroBlock":
      return asText(props.title) ? [levelOf(props.headingLevel, 2)] : [];
    case "FeatureList": {
      const levels: number[] = [];
      if (asText(props.heading)) levels.push(levelOf(props.headingLevel, 2));
      const items = Array.isArray(props.items) ? (props.items as Record<string, unknown>[]) : [];
      for (const item of items) if (asText(item?.title)) levels.push(3);
      return levels;
    }
    case "CallToAction":
      return asText(props.heading) ? [2] : [];
    // 附件下載／相關連結／聯絡資訊共用藍框，標題沒填時前台會用預設文字，一律輸出 H2
    case "FileDownloads":
    case "RelatedLinks":
    case "ContactInfo":
      return [2];
    default:
      return [];
  }
}

/** 取出 Puck 資料裡的區塊陣列；不是 Puck 格式（舊的純文字／HTML 內容）回傳 null，不檢查 */
function parseBlocks(data: unknown): PuckBlock[] | null {
  let value = data;
  if (typeof value === "string") {
    if (!value.trim()) return null;
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const content = (value as { content?: unknown } | null)?.content;
  return Array.isArray(content) ? (content as PuckBlock[]) : null;
}

export function checkContentRules(data: unknown): ContentIssue[] {
  const blocks = parseBlocks(data);
  if (!blocks) return [];

  const issues: ContentIssue[] = [];
  const add = (index: number, block: PuckBlock, level: ContentIssueLevel, message: string) =>
    issues.push({ level, blockNumber: index + 1, blockLabel: labelOf(block), message });

  // ---- 規則 1：標題不能跳級（依區塊順序，從文章標題 H2 往下接）----
  let previous = PAGE_TITLE_LEVEL;
  blocks.forEach((block, index) => {
    for (const level of headingsOf(block)) {
      if (level > previous + 1) {
        add(
          index,
          block,
          "error",
          `標題是 H${level}，但前面最近的標題是 H${previous}，不能跳級。請把標題層級改成 H2～H${previous + 1} 之間（文章本身的標題是 H2）。`,
        );
      }
      previous = level;
    }
  });

  blocks.forEach((block, index) => {
    const props = block.props ?? {};

    // ---- 規則 0：還留著編輯器元件的預設範例文字（關鍵字偵測）----
    let placeholderHit = false;
    for (const keyword of PLACEHOLDER_KEYWORDS) {
      if (!containsText(block, keyword)) continue;
      placeholderHit = true;
      add(index, block, "error", `還留著編輯器的預設範例文字「${keyword}」，請改成真正的內容（圖片請填能描述這張圖的替代文字）。`);
    }

    // ---- 規則 2：圖片一定要有替代文字（唯一必填欄位；「顯示圖說」只是把它顯示在圖片下方）----
    // 舊內容有獨立的圖片說明（imageCaption），前台會拿它當替代文字，所以也算有；兩個都沒有才是錯誤
    if (block.type === "ImageFeature") {
      const alt = asText(props.alt);
      const hasAlt = alt !== "" && alt !== SAMPLE_ALT;
      const hasLegacyCaption = asText(props.imageCaption) !== "";
      // 已經因為留著範例文字報過錯的區塊不再重複報「沒有替代文字」
      if (!hasAlt && !hasLegacyCaption && !placeholderHit) {
        add(index, block, "error", "圖片沒有替代文字。請填「替代文字」，用一句話說明這張圖的內容；想在圖片下方顯示成圖說，打開「顯示圖說」。");
      }
    }

    // ---- 規則 3：連結文字要能說明去哪裡（只提醒）----
    const linkTexts: string[] = [];
    if (block.type === "RelatedLinks" && Array.isArray(props.items)) {
      for (const item of props.items as Record<string, unknown>[]) linkTexts.push(asText(item?.title));
    }
    if (block.type === "NavigationCard") linkTexts.push(asText(props.linkText));
    if (block.type === "CallToAction") linkTexts.push(asText(props.primaryButtonText), asText(props.secondaryButtonText));
    for (const text of linkTexts) {
      if (text && GENERIC_LINK_TEXTS.has(text.toLowerCase())) {
        add(index, block, "warning", `連結文字「${text}」看不出要去哪裡，請改成能單獨說明目的的文字，例如「下載申請須知」。`);
      }
    }
    if (block.type === "RelatedLinks" && Array.isArray(props.items)) {
      const seen = new Map<string, string>();
      for (const item of props.items as Record<string, unknown>[]) {
        const text = asText(item?.title);
        const url = asText(item?.url);
        if (!text) continue;
        if (seen.has(text) && seen.get(text) !== url) {
          add(index, block, "warning", `有兩個連結都叫「${text}」但網址不同，讀螢幕閱讀器的人分不出差別，請改成不同的名稱。`);
        }
        seen.set(text, url);
      }
    }
  });

  return issues;
}

/** 單行描述，給對話框與清單用 */
export function formatIssue(issue: ContentIssue): string {
  return `第 ${issue.blockNumber} 個區塊「${issue.blockLabel}」：${issue.message}`;
}
