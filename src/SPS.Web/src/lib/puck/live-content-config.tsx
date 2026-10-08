import type { Config } from "@puckeditor/core";
import type { CSSProperties, ReactNode } from "react";
import { renderReactIcon } from "@/lib/puck/ionicons";
import { IconPicker } from "@/components/puck/IconPicker";
import { ImageUploadField } from "@/components/puck/ImageUploadField";
import { Icon } from "@/components/puck/Icon";
import { VisuallyHidden } from "@/components/puck/VisuallyHidden";
import { FileUploaderField } from "@/components/puck/FileUploaderField";
import { RichTextField } from "@/components/puck/RichTextField";
import { RichTextContent } from "@/components/puck/RichTextContent";

/**
 * 公告內容區塊（Puck）。2026-10-08 起 17 個區塊全部改成 SPS 網站的樣式（藍色漸層標題、圓角淺藍底、藍框的
 * 「附件下載／相關連結／聯絡資訊」等，對照 `public/css/style.css` 的 `.dow-name`、`.dk_conbo`、`ul.ul-key`），
 * 並新增「相關連結」「聯絡資訊」兩個公告專用區塊、把左側面板分成四組。設計稿見「公告內容區塊設計」。
 *
 * **這份檔案在後台（SPS.AdminWeb/src/lib/puck/config.tsx）與前台（SPS.Web/src/lib/puck/live-content-config.tsx）
 * 是同一份內容，修改時兩邊要一起改**——後台編輯器的預覽與前台公告頁用同一份 `render`，所以兩邊長得一樣。
 * 樣式全部用行內 style，不依賴 Tailwind／daisyUI／網站 CSS，後台預覽才會跟前台一致。
 *
 * 舊內容相容：欄位名稱沒有改（`titleSize` 的 `text-5xl` 舊值當成「大」），已存的公告照常顯示。
 */

// ==================== SPS 網站色票與共用樣式 ====================
const C = {
  ink: "#1a1a1a",
  text: "#434343",
  blue: "#0052cc",
  navy: "#0e3f6b",
  panel: "#e9f0f4",
  stripe: "#f3f6f9",
  line: "#bebebe",
  rule: "#404040",
  border: "#cfd6dd",
  frame: "#0393bd",
  danger: "#c0392b",
};

const GRADIENT_BTN = "linear-gradient(90deg, #0099ff 0%, #0052cc 100%)";

const headingGradient: CSSProperties = {
  background: "linear-gradient(to right, #2f6ea7 16%, #0e3f6b 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

/** 只放行 http／https 與站內路徑，避免內容裡塞進 javascript: 之類的網址 */
function safeUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const value = url.trim();
  if (/^https?:\/\//i.test(value) || (value.startsWith("/") && !value.startsWith("//")) || value.startsWith("#")) return value;
  return undefined;
}

function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const iconProps = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false } as const;

const FileTitleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" {...iconProps}>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
    <path d="M14 3v5h5M12 11v5M9.5 13.5L12 16l2.5-2.5" />
  </svg>
);
const LinkTitleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" {...iconProps}>
    <path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1.2 1.2" />
    <path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1.2-1.2" />
  </svg>
);
const ContactTitleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="11" r="2.2" />
    <path d="M5.5 16c.6-1.7 1.9-2.5 3.5-2.5s2.9.8 3.5 2.5M14.5 10h4M14.5 13.5h3" />
  </svg>
);
const CaretIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={C.blue} aria-hidden="true" focusable="false" style={{ flex: "none" }}>
    <path d="M9 5l9 7-9 7V5z" />
  </svg>
);

/** 公告頁原本設計的藍框區塊（附件下載／相關連結／聯絡資訊共用）：外框＋底線標題 */
function DocFrame({ title, icon, children }: { title: ReactNode; icon: ReactNode; children: ReactNode }) {
  return (
    <section style={{ position: "relative", margin: "28px 0", padding: "30px 36px", border: `1px solid ${C.frame}`, borderRadius: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.rule}`, paddingBottom: 10, marginBottom: 22, color: C.blue }}>
        {icon}
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, ...headingGradient }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

const rowStyle = (index: number): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 16,
  ...(index > 0 ? { borderTop: `1px solid ${C.line}`, paddingTop: 16, marginTop: 16 } : {}),
});

const badgeStyle: CSSProperties = { fontSize: 11, fontWeight: 700, color: "#fff", background: C.blue, borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" };
const metaStyle: CSSProperties = { marginLeft: "auto", fontSize: 13, color: "#666", whiteSpace: "nowrap" };

/** 自訂欄位：富文字輸入框（多個區塊共用） */
const richField = (label: string) => ({
  type: "custom" as const,
  label,
  render: ({ value, onChange }: { value: unknown; onChange: (value: string) => void }) => (
    <RichTextField value={typeof value === "string" ? value : ""} onChange={(html) => onChange(html)} label={label} />
  ),
});

/**
 * 行內編輯欄位（2026-10-08）：點選區塊之後直接在畫布上點文字就能改（Puck 的 `contentEditable`）。
 * 注意：這類 prop 在編輯器裡不是純字串、而是「可編輯的節點」，渲染時只能直接放進畫面的子節點，
 * 不能拿去做字串運算（`trim`、`join`、`split`）或放進 `aria-label`／`title` 這類屬性。
 */
const inlineText = (label: string) => ({ type: "text" as const, label, contentEditable: true });
const inlineRich = (label: string) => ({ type: "richtext" as const, label, contentEditable: true });

// ==================== 類型定義 ====================
type Props = {
  HeroBlock: {
    title: string;
    subtitle: string;
    alignment: "left" | "center" | "right";
    headingLevel: "h2" | "h3";
    // `text-5xl` 是舊內容的值，當成「大」
    titleSize: "text-5xl" | "text-4xl" | "text-3xl";
    subtitleSize: "text-2xl" | "text-xl" | "text-base";
  };
  ArticleContent: {
    content: string;
    fontSize: "normal" | "large" | "extraLarge";
  };
  ImageFeature: {
    imageUrl: string;
    alt: string;
    layout: "left" | "right" | "top";
    description: string;
    imageCaption: string;
  };
  CallToAction: {
    heading: string;
    description: string;
    primaryButtonText: string;
    primaryButtonUrl: string;
    secondaryButtonText: string;
    secondaryButtonUrl: string;
  };
  Accordion: {
    items: {
      id: string;
      question: string;
      answer: string;
    }[];
  };
  DataTable: {
    caption: string;
    headers: { value: string }[];
    rows: { cells: { value: string }[] }[];
  };
  Quote: {
    text: string;
    author: string;
    source: string;
  };
  NavigationCard: {
    title: string;
    description: string;
    linkUrl: string;
    linkText: string;
    iconType: "arrow" | "external" | "download" | "info";
  };
  AlertBanner: {
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    dismissible: boolean;
  };
  VideoEmbed: {
    videoUrl: string;
    title: string;
    transcript: string;
  };
  TwoColumnLayout: {
    leftContent: string;
    rightContent: string;
    ratio: "50-50" | "33-67" | "67-33";
  };
  Divider: {
    style: "solid" | "dashed" | "decorative";
    spacing: "small" | "medium" | "large";
    ariaHidden: boolean;
  };
  FeatureList: {
    heading: string;
    headingLevel: "h2" | "h3" | "h4";
    items: {
      title: string;
      description: string;
      icon: string;
    }[];
  };
  FileDownloads: {
    heading: string;
    description: string;
    files: {
      id: string;
      name: string;
      url: string;
      size: string;
      type: "pdf" | "doc" | "xls" | "ppt" | "zip" | "image" | "other";
    }[];
    openInNewTab: boolean;
    enableDownloadAttr: boolean;
  };
  RelatedLinks: {
    heading: string;
    items: { id: string; title: string; url: string }[];
  };
  ContactInfo: {
    heading: string;
    name: string;
    phone: string;
    email: string;
  };
};

// ==================== Puck 配置 ====================
export const puckConfig: Config<Props> = {
  categories: {
    text: {
      title: "文字與結構",
      components: ["HeroBlock", "ArticleContent", "TwoColumnLayout", "Divider"],
      defaultExpanded: true,
    },
    emphasis: {
      title: "內容強調",
      components: ["Quote", "AlertBanner", "DataTable", "Accordion", "FeatureList"],
      defaultExpanded: true,
    },
    media: {
      title: "圖片與影片",
      components: ["ImageFeature", "VideoEmbed"],
      defaultExpanded: true,
    },
    announcement: {
      title: "連結與公告專用",
      components: ["FileDownloads", "RelatedLinks", "ContactInfo", "CallToAction", "NavigationCard"],
      defaultExpanded: true,
    },
  },

  components: {
    // ==========================================
    // 標題區塊
    // ==========================================
    HeroBlock: {
      fields: {
        title: inlineText("標題內容"),
        titleSize: {
          type: "radio",
          label: "標題大小",
          options: [
            { label: "大標（藍色粗條＋漸層字）", value: "text-4xl" },
            { label: "小標（深藍單色）", value: "text-3xl" },
          ],
        },
        subtitle: inlineRich("副標題內容"),
        subtitleSize: {
          type: "radio",
          label: "副標題大小",
          options: [
            { label: "大", value: "text-2xl" },
            { label: "中", value: "text-xl" },
            { label: "小", value: "text-base" },
          ],
        },
        alignment: {
          type: "radio",
          label: "對齊方式",
          options: [
            { label: "置左", value: "left" },
            { label: "置中", value: "center" },
            { label: "置右", value: "right" },
          ],
        },
        headingLevel: {
          type: "radio",
          label: "標題層級 (SEO)",
          options: [
            { label: "H2(請確保只有一個H2標題)", value: "h2" },
            { label: "H3", value: "h3" },
          ],
        },
      },
      defaultProps: {
        title: "計畫重點",
        titleSize: "text-4xl",
        subtitle: "",
        subtitleSize: "text-base",
        alignment: "left",
        headingLevel: "h2",
      },
      render: ({ title, titleSize, subtitle, subtitleSize, alignment, headingLevel }) => {
        const HeadingTag = headingLevel as "h2" | "h3";
        const big = titleSize !== "text-3xl";
        const subSize = { "text-2xl": 20, "text-xl": 18, "text-base": 16 }[subtitleSize] ?? 16;

        return (
          <header style={{ margin: "12px 0 16px", textAlign: alignment }}>
            <HeadingTag
              style={
                big
                  ? { margin: 0, display: "inline-flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 700, lineHeight: 1.35, ...headingGradient }
                  : { margin: 0, fontSize: 21, fontWeight: 700, lineHeight: 1.4, color: C.navy }
              }
            >
              {big && <span aria-hidden="true" style={{ display: "inline-block", width: 6, height: 30, background: C.blue, borderRadius: 2, flex: "none" }} />}
              {title}
            </HeadingTag>
            {subtitle ? (
              <div style={{ marginTop: 8, fontSize: subSize, lineHeight: 1.8, color: C.text }}>
                <RichTextContent html={subtitle} />
              </div>
            ) : null}
          </header>
        );
      },
      label: "標題區塊",
    },

    // ==========================================
    // 文章段落
    // ==========================================
    ArticleContent: {
      fields: {
        content: inlineRich("文章內容"),
        fontSize: {
          type: "radio",
          label: "文字大小（無障礙考量）",
          options: [
            { label: "標準 (16px)", value: "normal" },
            { label: "大 (18px)", value: "large" },
            { label: "特大 (20px)", value: "extraLarge" },
          ],
        },
      },
      defaultProps: {
        content: "請在此輸入文章內容。每段聚焦一個主題，段落之間留白，讀起來比較輕鬆。",
        fontSize: "normal",
      },
      render: ({ content, fontSize }) => {
        const size = { normal: 16, large: 18, extraLarge: 20 }[fontSize] ?? 16;
        return (
          <article style={{ margin: "10px 0 18px", fontSize: size, lineHeight: 1.9, color: C.text, letterSpacing: "1px" }}>
            <RichTextContent html={content} />
          </article>
        );
      },
      label: "文章段落",
    },

    // ==========================================
    // 圖片區塊
    // ==========================================
    ImageFeature: {
      fields: {
        imageUrl: {
          type: "custom",
          label: "圖片",
          render: ({ value, onChange }) => <ImageUploadField value={typeof value === "string" ? value : ""} onChange={(url) => onChange(url)} label="圖片" />,
        },
        alt: { type: "textarea", label: "替代文字（必填）" },
        imageCaption: inlineText("圖片說明"),
        description: inlineRich("詳細描述"),
        layout: {
          type: "radio",
          label: "排版方式",
          options: [
            { label: "左圖右文", value: "left" },
            { label: "右圖左文", value: "right" },
            { label: "上圖下文", value: "top" },
          ],
        },
      },
      defaultProps: {
        imageUrl: "https://placehold.co/800x600/dfe8ef/6b7c8c?text=範例圖片",
        alt: "這是一張範例圖片",
        imageCaption: "圖片說明",
        description: "",
        layout: "top",
      },
      render: ({ imageUrl, alt, imageCaption, description, layout }) => {
        const isTop = layout === "top";
        const hasText = typeof description === "string" ? description.trim() !== "" : Boolean(description);
        const linkable = safeUrl(imageUrl);
        const image = (
          <img src={imageUrl} alt={alt} loading="lazy" style={{ display: "block", width: "100%", height: "auto", borderRadius: 20 }} />
        );

        return (
          <figure style={{ margin: "18px 0" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", flexDirection: layout === "right" ? "row-reverse" : "row" }}>
              <div style={{ flex: isTop || !hasText ? "1 1 100%" : "1 1 320px", minWidth: 0 }}>
                {linkable ? (
                  <a href={linkable} target="_blank" rel="noopener noreferrer" title="點擊另開視窗看原圖">
                    {image}
                  </a>
                ) : (
                  image
                )}
                {imageCaption ? (
                  <figcaption style={{ marginTop: 8, fontSize: 14, color: "#666", textAlign: "center" }}>{imageCaption}</figcaption>
                ) : null}
              </div>
              {hasText && (
                <div style={{ flex: isTop ? "1 1 100%" : "1 1 320px", minWidth: 0, fontSize: 16, lineHeight: 1.9, color: C.text }}>
                  <RichTextContent html={description} />
                </div>
              )}
            </div>
          </figure>
        );
      },
      label: "圖片區塊",
    },

    // ==========================================
    // 行動呼籲
    // ==========================================
    CallToAction: {
      fields: {
        heading: inlineText("標題"),
        description: inlineRich("說明文字"),
        primaryButtonText: { type: "text", label: "主要按鈕文字" },
        primaryButtonUrl: { type: "text", label: "主要按鈕連結" },
        secondaryButtonText: { type: "text", label: "次要按鈕文字（選填）" },
        secondaryButtonUrl: { type: "text", label: "次要按鈕連結（選填）" },
      },
      defaultProps: {
        heading: "立即提出申請",
        description: "申請期間內請先下載申請須知，再依說明填寫。",
        primaryButtonText: "前往申請",
        primaryButtonUrl: "#",
        secondaryButtonText: "下載申請須知",
        secondaryButtonUrl: "#",
      },
      render: ({ heading, description, primaryButtonText, primaryButtonUrl, secondaryButtonText, secondaryButtonUrl }) => {
        const primary = safeUrl(primaryButtonUrl);
        const secondary = safeUrl(secondaryButtonUrl);
        const base: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 46, padding: "0 30px", borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: "none" };
        return (
          <section style={{ margin: "28px 0", padding: "30px 20px", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: C.navy }}>{heading}</h2>
            <div style={{ margin: "0 0 20px", fontSize: 16, lineHeight: 1.8, color: C.text }}>
              <RichTextContent html={description} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
              {primaryButtonText && primary && (
                <a href={primary} style={{ ...base, background: GRADIENT_BTN, color: "#fff" }}>
                  {primaryButtonText}
                </a>
              )}
              {secondaryButtonText && secondary && (
                <a href={secondary} style={{ ...base, border: `1.5px solid ${C.blue}`, color: C.blue, background: "#fff" }}>
                  {secondaryButtonText}
                </a>
              )}
            </div>
          </section>
        );
      },
      label: "行動呼籲",
    },

    // ==========================================
    // 手風琴（常見問題）
    // ==========================================
    Accordion: {
      fields: {
        items: {
          type: "array",
          label: "問答項目",
          arrayFields: {
            id: { type: "text", label: "項目 ID（唯一識別碼）" },
            question: { type: "text", label: "問題" },
            answer: richField("答案"),
          },
        },
      },
      defaultProps: {
        items: [
          { id: "faq-1", question: "誰可以申請？", answer: "依法登記之製造業公司，且於申請時已完成工廠登記。" },
          { id: "faq-2", question: "需要準備哪些文件？", answer: "請參考申請須知，備齊公司登記證明與計畫書。" },
        ],
      },
      render: ({ items }) => (
        <section style={{ margin: "18px 0", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          {items.map((item, index) => (
            <details key={item.id || index} style={index > 0 ? { borderTop: `1px solid ${C.border}` } : undefined}>
              <summary
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44, padding: "14px 18px", cursor: "pointer", listStyle: "none", background: C.panel, color: C.navy, fontSize: 16, fontWeight: 700 }}
              >
                <span>{item.question}</span>
                <span style={{ flex: "none", color: C.blue }} aria-hidden="true">
                  <Icon type="chevronDown" size={20} />
                </span>
              </summary>
              <div style={{ padding: "14px 18px", fontSize: 15, lineHeight: 1.8, color: C.text, background: "#fff" }}>
                <RichTextContent html={item.answer} />
              </div>
            </details>
          ))}
        </section>
      ),
      label: "手風琴（常見問題）",
    },

    // ==========================================
    // 資料表格
    // ==========================================
    DataTable: {
      // 2026-10-08：表格的標題、欄位標題、儲存格改成「直接在畫布上點進去打字」（Puck 的 contentEditable 行內編輯），
      // 不用再到右側欄位面板一格一格改；右側面板仍然用來新增、刪除、排序欄與列。
      fields: {
        caption: { type: "text", label: "表格標題（無障礙必填）", contentEditable: true },
        headers: {
          type: "array",
          label: "欄位標題",
          arrayFields: { value: { type: "text", label: "標題文字", contentEditable: true } },
          getItemSummary: (item) => (typeof item.value === "string" && item.value) || "未命名欄位",
        },
        rows: {
          type: "array",
          label: "資料列",
          arrayFields: {
            cells: {
              type: "array",
              label: "儲存格",
              arrayFields: { value: { type: "richtext", label: "內容", contentEditable: true } },
            },
          },
        },
      },
      defaultProps: {
        caption: "補助項目與金額",
        headers: [{ value: "補助類別" }, { value: "補助比例" }, { value: "金額上限" }],
        rows: [
          { cells: [{ value: "智慧感測設備" }, { value: "50%" }, { value: "新臺幣 300 萬元" }] },
          { cells: [{ value: "系統建置與整合" }, { value: "40%" }, { value: "新臺幣 200 萬元" }] },
        ],
      },
      render: ({ caption, headers = [], rows = [] }) => (
        <section style={{ margin: "18px 0" }}>
          <div style={{ overflowX: "auto" }} role="region" aria-label={typeof caption === "string" ? caption : "資料表格"} tabIndex={0}>
            <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: 15 }}>
              <caption style={{ textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 16, marginBottom: 10 }}>{caption}</caption>
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index} scope="col" style={{ background: C.navy, color: "#fff", textAlign: "left", padding: "11px 14px", fontWeight: 500 }}>
                      {header.value}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {(row.cells ?? []).map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ padding: "11px 14px", borderBottom: "1px solid #d9dee3", color: "#333", background: rowIndex % 2 === 1 ? C.stripe : "#fff" }}>
                        <RichTextContent html={cell.value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ),
      label: "資料表格",
    },

    // ==========================================
    // 引言區塊
    // ==========================================
    Quote: {
      fields: {
        text: inlineRich("引言內容"),
        author: inlineText("作者姓名"),
        source: inlineText("出處（選填）"),
      },
      defaultProps: {
        text: "導入智慧工安技術之後，現場異常的發現時間縮短了一半。",
        author: "[受訪者姓名]",
        source: "[公司／單位名稱]",
      },
      render: ({ text, author, source }) => (
        <figure style={{ margin: "18px 0", width: "100%", boxSizing: "border-box" }}>
          <blockquote style={{ margin: 0, padding: "22px 26px", background: C.panel, borderRadius: 10 }}>
            <div style={{ fontSize: 18, lineHeight: 1.8, color: C.navy, fontWeight: 500 }}>
              <RichTextContent html={text} />
            </div>
            {(author || source) && (
              <figcaption style={{ marginTop: 12, fontSize: 14, color: "#555" }}>
                {author}
                {author && source ? "　·　" : null}
                {source}
              </figcaption>
            )}
          </blockquote>
        </figure>
      ),
      label: "引言區塊",
    },

    // ==========================================
    // 導覽卡片
    // ==========================================
    NavigationCard: {
      fields: {
        title: { type: "text", label: "標題" },
        description: richField("描述"),
        linkUrl: { type: "text", label: "連結網址" },
        linkText: { type: "text", label: "連結文字" },
        iconType: {
          type: "radio",
          label: "圖示類型",
          options: [
            { label: "箭頭（內部連結）", value: "arrow" },
            { label: "外部連結", value: "external" },
            { label: "下載", value: "download" },
            { label: "資訊", value: "info" },
          ],
        },
      },
      defaultProps: {
        title: "補助專區",
        description: "查看目前開放申請的補助計畫與申請方式。",
        linkUrl: "/support",
        linkText: "前往查看",
        iconType: "arrow",
      },
      render: ({ title, description, linkUrl, linkText, iconType }) => {
        const isExternal = iconType === "external";
        const href = safeUrl(linkUrl);
        const card = (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: C.text }}>
                <RichTextContent html={description} />
              </div>
              {linkText ? <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: C.blue }}>{linkText}</div> : null}
            </div>
            <span style={{ flex: "none", color: C.blue }} aria-hidden="true">
              <Icon type={iconType} size={26} />
            </span>
            {isExternal && <VisuallyHidden>（在新視窗開啟）</VisuallyHidden>}
          </>
        );
        const style: CSSProperties = { display: "flex", alignItems: "center", gap: 18, margin: "18px 0", padding: "20px 24px", borderRadius: 14, background: C.panel, textDecoration: "none", color: "inherit" };
        return href ? (
          <a href={href} style={style} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
            {card}
          </a>
        ) : (
          <div style={style}>{card}</div>
        );
      },
      label: "導覽卡片",
    },

    // ==========================================
    // 警示橫幅
    // ==========================================
    AlertBanner: {
      fields: {
        type: {
          type: "radio",
          label: "類型",
          options: [
            { label: "資訊提示", value: "info" },
            { label: "成功訊息", value: "success" },
            { label: "注意", value: "warning" },
            { label: "錯誤訊息", value: "error" },
          ],
        },
        title: inlineText("標題"),
        message: inlineRich("訊息內容"),
        dismissible: {
          type: "radio",
          label: "可關閉",
          options: [
            { label: "是", value: true },
            { label: "否", value: false },
          ],
        },
      },
      defaultProps: {
        type: "info",
        title: "資訊",
        message: "說明會將於 11 月 5 日下午 2 點舉行，採線上直播。",
        dismissible: false,
      },
      render: ({ type, title, message, dismissible }) => {
        const styles = {
          info: { bg: "#e8f3fd", border: "#0474d7", text: "#0b3a66", icon: "info" },
          success: { bg: "#eaf6ee", border: "#2e8b57", text: "#14452b", icon: "check" },
          warning: { bg: "#fff5e0", border: "#d98300", text: "#6b3f00", icon: "info" },
          error: { bg: "#fdeaea", border: C.danger, text: "#6e1a12", icon: "close" },
        }[type];

        return (
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: 12, margin: "14px 0", padding: "14px 16px", borderRadius: 10, border: `1px solid ${styles.border}`, background: styles.bg, color: styles.text }}
            role={type === "error" ? "alert" : "status"}
            aria-live={type === "error" ? "assertive" : "polite"}
          >
            <span style={{ flex: "none", marginTop: 2, color: styles.border }} aria-hidden="true">
              <Icon type={styles.icon} size={22} />
            </span>
            <div style={{ flex: 1, fontSize: 15, lineHeight: 1.7 }}>
              {title ? <b style={{ display: "block", marginBottom: 2 }}>{title}</b> : null}
              <RichTextContent html={message} />
            </div>
            {dismissible === true && (
              <button
                type="button"
                style={{ flex: "none", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: 0, color: styles.text, cursor: "pointer" }}
                aria-label="關閉此訊息"
                onClick={(e) => {
                  const banner = e.currentTarget.closest("[role]");
                  if (banner) (banner as HTMLElement).style.display = "none";
                }}
              >
                <Icon type="close" size={20} />
              </button>
            )}
          </div>
        );
      },
      label: "警示橫幅",
    },

    // ==========================================
    // 影片嵌入
    // ==========================================
    VideoEmbed: {
      fields: {
        videoUrl: { type: "text", label: "影片網址（YouTube 或 Vimeo 的嵌入網址）" },
        title: { type: "text", label: "影片標題（無障礙必填）" },
        transcript: richField("逐字稿（無障礙 AAA 必備）"),
      },
      defaultProps: {
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        title: "影片標題",
        transcript: "",
      },
      render: ({ videoUrl, title, transcript }) => {
        const src = safeUrl(videoUrl);
        const hasTranscript = typeof transcript === "string" ? transcript.trim() !== "" : Boolean(transcript);
        return (
          <section style={{ margin: "18px auto", maxWidth: 720 }}>
            <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 20, overflow: "hidden", background: C.navy }}>
              {src && (
                <iframe
                  src={src}
                  title={title}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              )}
            </div>
            {hasTranscript && (
              <details style={{ marginTop: 14, fontSize: 14, color: C.text }}>
                <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", color: C.blue, fontWeight: 700 }}>逐字稿（無障礙）</summary>
                <div style={{ marginTop: 6, lineHeight: 1.8 }}>
                  <RichTextContent html={transcript} />
                </div>
              </details>
            )}
          </section>
        );
      },
      label: "影片嵌入",
    },

    // ==========================================
    // 雙欄排版
    // ==========================================
    TwoColumnLayout: {
      fields: {
        leftContent: inlineRich("左欄內容"),
        rightContent: inlineRich("右欄內容"),
        ratio: {
          type: "radio",
          label: "欄寬比例",
          options: [
            { label: "1:1（均等）", value: "50-50" },
            { label: "1:2（左窄右寬）", value: "33-67" },
            { label: "2:1（左寬右窄）", value: "67-33" },
          ],
        },
      },
      defaultProps: {
        leftContent: "左欄內容。",
        rightContent: "右欄內容。",
        ratio: "50-50",
      },
      render: ({ leftContent, rightContent, ratio }) => {
        const grow = { "50-50": [1, 1], "33-67": [1, 2], "67-33": [2, 1] }[ratio] ?? [1, 1];
        const col = (grown: number): CSSProperties => ({ flex: `${grown} 1 260px`, minWidth: 0, fontSize: 16, lineHeight: 1.9, color: C.text });
        return (
          <section style={{ display: "flex", flexWrap: "wrap", gap: 28, margin: "18px 0" }}>
            <div style={col(grow[0])}>
              <RichTextContent html={leftContent} />
            </div>
            <div style={col(grow[1])}>
              <RichTextContent html={rightContent} />
            </div>
          </section>
        );
      },
      label: "雙欄排版",
    },

    // ==========================================
    // 分隔線
    // ==========================================
    Divider: {
      fields: {
        style: {
          type: "radio",
          label: "樣式",
          options: [
            { label: "實線", value: "solid" },
            { label: "虛線", value: "dashed" },
            { label: "裝飾線（藍色漸層）", value: "decorative" },
          ],
        },
        spacing: {
          type: "radio",
          label: "間距",
          options: [
            { label: "小", value: "small" },
            { label: "中", value: "medium" },
            { label: "大", value: "large" },
          ],
        },
        ariaHidden: {
          type: "radio",
          label: "對螢幕閱讀器隱藏",
          options: [
            { label: "是（純裝飾用）", value: "true" },
            { label: "否（作為內容分隔）", value: "false" },
          ],
        },
      },
      defaultProps: {
        style: "solid",
        spacing: "medium",
        ariaHidden: true,
      },
      render: ({ style, spacing, ariaHidden }) => {
        const margin = { small: 14, medium: 28, large: 48 }[spacing] ?? 28;
        const hidden = ariaHidden === true || (ariaHidden as unknown) === "true";
        const role = hidden ? "presentation" : "separator";

        if (style === "decorative") {
          return <div style={{ height: 4, margin: `${margin}px 0`, borderRadius: 4, background: GRADIENT_BTN }} role={role} aria-hidden={hidden} />;
        }
        return (
          <hr
            style={{ margin: `${margin}px 0`, border: 0, borderTop: style === "dashed" ? "2px dashed #8aa4bf" : `1px solid ${C.rule}` }}
            role={role}
            aria-hidden={hidden}
          />
        );
      },
      label: "分隔線",
    },

    // ==========================================
    // 特色清單
    // ==========================================
    FeatureList: {
      fields: {
        heading: inlineText("區塊標題"),
        headingLevel: {
          type: "radio",
          label: "標題層級",
          options: [
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
            { label: "H4", value: "h4" },
          ],
        },
        items: {
          type: "array",
          label: "項目",
          arrayFields: {
            title: inlineText("名稱"),
            description: inlineRich("說明"),
            icon: {
              type: "custom",
              render: ({ value, onChange }) => <IconPicker value={typeof value === "string" ? value : ""} onChange={(next) => onChange(next)} />,
            },
          },
        },
      },
      defaultProps: {
        heading: "計畫特色",
        headingLevel: "h2",
        items: [
          { title: "即時監測", description: "感測資料即時回傳，異常即刻通知。", icon: "io5:IoFlashOutline" },
          { title: "安全可靠", description: "多重機制保護資料與現場安全。", icon: "io5:IoShieldCheckmarkOutline" },
          { title: "專業支援", description: "專人協助導入與教育訓練。", icon: "io5:IoStarOutline" },
        ],
      },
      render: ({ heading, headingLevel, items }) => {
        const HeadingTag = headingLevel as "h2" | "h3" | "h4";
        return (
          <section style={{ margin: "18px 0" }}>
            {heading ? <HeadingTag style={{ margin: "0 0 14px", fontSize: 21, fontWeight: 700, color: C.navy }}>{heading}</HeadingTag> : null}
            <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((item, index) => (
                <li key={index} style={{ padding: 20, borderRadius: 12, background: C.panel }}>
                  <div
                    style={{ width: 44, height: 44, borderRadius: 10, background: GRADIENT_BTN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}
                    aria-hidden="true"
                  >
                    {renderReactIcon(item.icon, 22)}
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: C.navy }}>{item.title}</h3>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: C.text }}>
                    <RichTextContent html={item.description} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      },
      label: "特色清單",
    },

    // ==========================================
    // 附件下載（公告頁原本設計的藍框區塊）
    // ==========================================
    FileDownloads: {
      fields: {
        heading: inlineText("標題"),
        description: { type: "textarea", label: "說明（選填）" },
        files: {
          type: "custom",
          label: "檔案清單",
          render: ({ value, onChange }) => (
            <div role="group" aria-label="檔案上傳與管理">
              <FileUploaderField value={Array.isArray(value) ? value : []} onChange={onChange} />
            </div>
          ),
        },
        openInNewTab: {
          type: "radio",
          label: "在新視窗開啟",
          options: [
            { label: "是", value: "true" },
            { label: "否", value: "false" },
          ],
        },
        enableDownloadAttr: {
          type: "radio",
          label: "點擊直接下載（加上 download 屬性）",
          options: [
            { label: "是", value: "true" },
            { label: "否", value: "false" },
          ],
        },
      },
      defaultProps: {
        heading: "附件下載",
        description: "",
        files: [],
        openInNewTab: true,
        enableDownloadAttr: true,
      },
      render: ({ heading, description, files, openInNewTab, enableDownloadAttr }) => {
        const typeLabelMap: Record<string, string> = { pdf: "PDF", doc: "Word", xls: "Excel", ppt: "PPT", zip: "ZIP", image: "圖片", other: "檔案" };
        const toBool = (v: unknown) => v === true || v === "true";
        const newTab = toBool(openInNewTab);
        const download = toBool(enableDownloadAttr);

        return (
          <DocFrame title={heading || "附件下載"} icon={<FileTitleIcon />}>
            {description ? <p style={{ margin: "0 0 16px", fontSize: 15, color: C.text }}>{description}</p> : null}
            {!files || files.length === 0 ? (
              <p style={{ margin: 0, fontSize: 15, color: "#666" }}>尚未新增檔案。</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {files.map((f, idx) => {
                  const ext = (f.name || "").split(".").pop();
                  const label = ext && ext.length <= 5 && ext !== f.name ? ext.toUpperCase() : typeLabelMap[f.type] ?? "檔案";
                  const href = safeUrl(f.url);
                  return (
                    <li key={f.id || idx} style={rowStyle(idx)}>
                      <CaretIcon />
                      {href ? (
                        <a
                          href={href}
                          target={newTab ? "_blank" : undefined}
                          rel={newTab ? "noopener noreferrer" : undefined}
                          {...(download ? { download: f.name || true } : {})}
                          style={{ color: "#090909", textDecoration: "none", minWidth: 0, overflowWrap: "anywhere" }}
                          aria-label={`下載檔案：${f.name || "附件"}`}
                        >
                          {f.name || "未命名檔案"}
                        </a>
                      ) : (
                        <span style={{ color: C.danger }}>{f.name || "未命名檔案"}（缺少連結）</span>
                      )}
                      <span style={badgeStyle}>{label}</span>
                      {f.size ? <span style={metaStyle}>{f.size}</span> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </DocFrame>
        );
      },
      label: "附件下載",
    },

    // ==========================================
    // 相關連結（新增）
    // ==========================================
    RelatedLinks: {
      fields: {
        heading: inlineText("標題"),
        items: {
          type: "array",
          label: "連結清單",
          arrayFields: {
            id: { type: "text", label: "項目 ID（唯一識別碼）" },
            title: { type: "text", label: "連結名稱" },
            url: { type: "text", label: "網址（http／https 開頭，或站內路徑）" },
          },
          getItemSummary: (item) => item.title || "未命名連結",
        },
      },
      defaultProps: {
        heading: "相關連結",
        items: [{ id: "link-1", title: "經濟部產業發展署", url: "https://www.ida.gov.tw/" }],
      },
      render: ({ heading, items = [] }) => (
        <DocFrame title={heading || "相關連結"} icon={<LinkTitleIcon />}>
          {items.length === 0 ? (
            <p style={{ margin: 0, fontSize: 15, color: "#666" }}>尚未新增連結。</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((item, idx) => {
                const href = safeUrl(item.url);
                const external = href ? /^https?:\/\//i.test(href) : false;
                return (
                  <li key={item.id || idx} style={rowStyle(idx)}>
                    <CaretIcon />
                    {href ? (
                      <a
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        style={{ color: "#090909", textDecoration: "none", minWidth: 0, overflowWrap: "anywhere" }}
                        title={external ? `${item.title}（另開視窗）` : item.title}
                      >
                        {item.title || href}
                      </a>
                    ) : (
                      <span style={{ color: C.danger }}>{item.title || "未命名連結"}（網址無效）</span>
                    )}
                    {external ? <span style={metaStyle}>{hostOf(href)}</span> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </DocFrame>
      ),
      label: "相關連結",
    },

    // ==========================================
    // 聯絡資訊（新增）
    // ==========================================
    ContactInfo: {
      fields: {
        heading: inlineText("標題"),
        name: { type: "text", label: "聯絡人" },
        phone: { type: "text", label: "電話（分機用 # 隔開，例如 07-5503115#123）" },
        email: { type: "text", label: "信箱" },
      },
      defaultProps: {
        heading: "聯絡資訊",
        name: "",
        phone: "",
        email: "",
      },
      render: ({ heading, name, phone, email }) => {
        const dial = (phone ?? "").split("#")[0].replace(/[^0-9+]/g, "");
        const mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email ?? "").trim()) ? email.trim() : undefined;
        const rows = [
          name ? { label: "聯絡人：", content: <span>{name}</span> } : null,
          phone ? { label: "電話：", content: dial ? <a href={`tel:${dial}`} style={{ color: C.blue, textDecoration: "none" }}>{phone}</a> : <span>{phone}</span> } : null,
          email ? { label: "信箱：", content: mail ? <a href={`mailto:${mail}`} style={{ color: C.blue, textDecoration: "none" }}>{mail}</a> : <span>{email}</span> } : null,
        ].filter(Boolean) as { label: string; content: ReactNode }[];

        return (
          <DocFrame title={heading || "聯絡資訊"} icon={<ContactTitleIcon />}>
            {rows.length === 0 ? (
              <p style={{ margin: 0, fontSize: 15, color: "#666" }}>尚未填寫聯絡資訊。</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 16 }}>
                {rows.map((row) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ minWidth: 76, color: "#555" }}>{row.label}</span>
                    {row.content}
                  </div>
                ))}
              </div>
            )}
          </DocFrame>
        );
      },
      label: "聯絡資訊",
    },
  },
};
