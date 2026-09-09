import type { Config } from "@puckeditor/core";
import { renderReactIcon } from "@/lib/puck/ionicons";
import { IconPicker } from "@/components/puck/IconPicker";
import { ImageUploadField } from "@/components/puck/ImageUploadField";
import { colors } from "@/components/puck/theme";
import {Icon} from "@/components/puck/Icon";
import {VisuallyHidden} from "@/components/puck/VisuallyHidden";
import {FileUploaderField} from "@/components/puck/FileUploaderField";
import {RichTextField} from "@/components/puck/RichTextField";
import {RichTextContent} from "@/components/puck/RichTextContent";


/**
 * WCAG AAA 無障礙設計原則：
 * - 對比度至少 7:1（一般文字）或 4.5:1（大型文字）
 * - 所有互動元素可透過鍵盤操作
 * - 提供適當的 ARIA 標籤與語義化 HTML
 */

// ==================== 類型定義 ====================
type Props = {
  HeroBlock: {
    title: string;
    subtitle: string;
    alignment: "left" | "center" | "right";
    headingLevel: "h2" | "h3";
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
};


// ============================================
// 輔助元件
// ============================================

// 視覺隱藏但螢幕閱讀器可讀的文字

// ==================== Puck 配置 ====================
export const puckConfig: Config<Props> = {
  categories: {
    structure: {
      title: "結構元件",
      defaultExpanded: true,
    },
    content: {
      title: "內容元件",
      defaultExpanded: true,
    },
    navigation: {
      title: "導覽元件",
    },
    media: {
      title: "媒體元件",
    },
    interactive: {
      title: "互動元件",
    },
    accessibility: {
      title: "無障礙輔助元件",
    },
  },

  components: {
    // ==========================================
    // 大標題區塊
    // ==========================================
    HeroBlock: {
      fields: {
        title: {
          type: "text",
          label: "主標題內容",
        },
        titleSize: {
          type: "radio", // 或者用 radio
          label: "主標題大小",
          options: [
            { label: "大", value: "text-5xl" },
            { label: "中", value: "text-4xl" },
            { label: "小", value: "text-3xl" },
          ],
        },
        subtitle: {
          type: "custom",
          label: "副標題內容",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="副標題內容"
            />
          ),
        },
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
        title: "歡迎來到我們的網站",
        titleSize: "text-4xl",
        subtitle: "我們致力於提供最優質的服務與體驗",
        subtitleSize: "text-xl",
        alignment: "center",
        headingLevel: "h2",
      },
      render: ({ title, titleSize, subtitle, subtitleSize, alignment, headingLevel }) => {
        const HeadingTag = headingLevel as 'h2' | 'h3';

        // 對齊類名
        const alignmentClass = {
          left: "text-left items-start",
          center: "text-center items-center",
          right: "text-right items-end",
        }[alignment];

        return (
          <header className={`py-16 md:py-24 px-6 flex flex-col ${alignmentClass}`}>
            <div className="max-w-4xl w-full">
              <HeadingTag
                className={`${titleSize} font-bold tracking-tight mb-6 leading-tight`}
                style={{ color: colors.textPrimary }}
              >
                {title}
              </HeadingTag>
              <div
                className={`${subtitleSize} leading-relaxed`}
                style={{
                  color: colors.textSecondary,
                  marginLeft: alignment === "center" ? "auto" : undefined,
                  marginRight: alignment === "center" ? "auto" : undefined,
                }}
              >
                <RichTextContent html={subtitle} />
              </div>
            </div>
          </header>
        );
      },
      label: "大標題區塊",
    },

    // ==========================================
    // 文章段落
    // ==========================================
    ArticleContent: {
      fields: {
        content: {
          type: "custom",
          label: "文章內容",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="文章內容"
            />
          ),
        },
        fontSize: {
          type: "radio",
          label: "文字大小（無障礙考量）",
          options: [
            { label: "標準 (18px)", value: "normal" },
            { label: "大 (20px)", value: "large" },
            { label: "特大 (22px)", value: "extraLarge" },
          ],
        },
      },
      defaultProps: {
        content:
          "請在此輸入您的文章內容。良好的文章結構包含清晰的段落分隔，每段聚焦於一個主題，並使用適當的過渡詞彙連接各段落。\n\n這是第二段的範例內容。保持每段的長度適中，避免過長的段落影響閱讀體驗。",
        fontSize: "normal",
      },
      render: ({ content, fontSize }) => {
        const fontSizeClass = {
          normal: "text-lg", // 18px
          large: "text-xl", // 20px
          extraLarge: "text-[22px]", // 22px
        }[fontSize];

        return (
          <article className="max-w-3xl mx-auto py-12 px-6">
            <div
              className={`${fontSizeClass} leading-[1.8]`}
              style={{ color: colors.textPrimary }}
            >
              <RichTextContent html={content} />
            </div>
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
          render: ({ value, onChange }) => (
            <ImageUploadField
              value={typeof value === "string" ? value : ""}
              onChange={(url) => onChange(url)}
              label="圖片"
            />
          ),
        },
        alt: { type: "textarea", label: "替代文字（必填）" },
        imageCaption: { type: "text", label: "圖片說明" },
        description: {
          type: "custom",
          label: "詳細描述",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="詳細描述"
            />
          ),
        },
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
        imageUrl: "https://placehold.co/800x600/1a1a1a/ffffff?text=範例圖片",
        alt: "這是一張範例圖片",
        imageCaption: "圖片說明",
        description: "這是關於圖片的詳細描述。",
        layout: "left",
      },
      render: ({ imageUrl, alt, imageCaption, description, layout }) => {
        const isTop = layout === "top";
        const isRight = layout === "right";

        return (
          <section className="max-w-5xl mx-auto py-12 px-6">
            <figure
              className={`flex flex-col gap-8 ${
                isTop ? "" : isRight ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className={`${isTop ? "w-full" : "lg:flex-1"}`}>
                <img
                  src={imageUrl}
                  alt={alt}
                  className="w-full h-auto rounded-lg shadow-md"
                  style={{ border: `1px solid ${colors.borderLight}` }}
                  loading="lazy"
                />
                {imageCaption && (
                  <figcaption className="mt-3 text-base text-center" style={{ color: colors.textSecondary }}>
                    {imageCaption}
                  </figcaption>
                )}
              </div>
              <div className={`${isTop ? "w-full" : "lg:flex-1"} text-lg leading-relaxed`} style={{ color: colors.textPrimary }}>
                <RichTextContent html={description} />
              </div>
            </figure>
          </section>
        );
      },
      label: "圖片區塊",
    },

    // ==========================================
    // 行動呼籲區塊
    // ==========================================
    CallToAction: {
      fields: {
        heading: { type: "text", label: "標題" },
        description: {
          type: "custom",
          label: "說明文字",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="說明文字"
            />
          ),
        },
        primaryButtonText: { type: "text", label: "主要按鈕文字" },
        primaryButtonUrl: { type: "text", label: "主要按鈕連結" },
        secondaryButtonText: { type: "text", label: "次要按鈕文字（選填）" },
        secondaryButtonUrl: { type: "text", label: "次要按鈕連結（選填）" },
      },
      defaultProps: {
        heading: "準備好開始了嗎？",
        description: "立即加入我們，體驗全新的服務。",
        primaryButtonText: "立即開始",
        primaryButtonUrl: "#",
        secondaryButtonText: "了解更多",
        secondaryButtonUrl: "#",
      },
      render: ({ heading, description, primaryButtonText, primaryButtonUrl, secondaryButtonText, secondaryButtonUrl }) => (
        <section className="py-16 px-6" style={{ backgroundColor: colors.bgTertiary }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              {heading}
            </h2>
            <div className="text-lg mb-8" style={{ color: colors.textSecondary }}>
              <RichTextContent html={description} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={primaryButtonUrl}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg"
                style={{ backgroundColor: colors.accent, color: colors.bgPrimary }}
              >
                {primaryButtonText}
              </a>
              {secondaryButtonText && secondaryButtonUrl && (
                <a
                  href={secondaryButtonUrl}
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg"
                  style={{ backgroundColor: "transparent", color: colors.accent, border: `2px solid ${colors.accent}` }}
                >
                  {secondaryButtonText}
                </a>
              )}
            </div>
          </div>
        </section>
      ),
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
            id: {
              type: "text",
              label: "項目 ID（唯一識別碼）",
            },
            question: {
              type: "text",
              label: "問題",
            },
            answer: {
              type: "custom",
              label: "答案",
              render: ({ value, onChange }) => (
                <RichTextField
                  value={typeof value === "string" ? value : ""}
                  onChange={(html) => onChange(html)}
                  label="答案"
                />
              ),
            },
          },
        },
      },
      defaultProps: {
        items: [
          {
            id: "faq-1",
            question: "如何建立帳號？",
            answer:
              "您可以點擊右上角的「註冊」按鈕，填寫必要資訊後即可完成帳號建立。整個過程約需 2 分鐘。",
          },
          {
            id: "faq-2",
            question: "忘記密碼怎麼辦？",
            answer:
              "請點擊登入頁面的「忘記密碼」連結，輸入您的電子郵件地址，我們會寄送重設密碼的連結給您。",
          },
          {
            id: "faq-3",
            question: "如何聯繫客服？",
            answer:
              "您可以透過以下方式聯繫我們：\n• 電子郵件：support@example.com\n• 客服專線：0800-123-456（週一至週五 9:00-18:00）\n• 線上客服：網站右下角的對話視窗",
          },
        ],
      },
      render: ({ items }) => (
        <section className="max-w-3xl mx-auto py-12 px-6">
          <div
            className="divide-y rounded-lg overflow-hidden"
            style={{
              borderColor: colors.border,
              border: `1px solid ${colors.border}`,
            }}
          >
            {items.map((item, index) => (
              <details
                key={item.id || index}
                className="group"
                style={{ backgroundColor: colors.bgPrimary }}
              >
                <summary
                  className="flex items-center justify-between px-6 py-5 cursor-pointer list-none min-h-11 text-lg font-semibold transition-colors motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-inset"
                  style={{
                    color: colors.textPrimary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outlineColor = colors.accent;
                  }}
                >
                  <span className="pr-4">{item.question}</span>
                  <span
                    className="shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  >
                    <Icon type="chevronDown" size={24} />
                  </span>
                </summary>
                <div
                  className="px-6 pb-5 text-base leading-relaxed"
                  style={{ backgroundColor: colors.bgSecondary, color: colors.textSecondary }}
                >
                  <RichTextContent html={item.answer} />
                </div>
              </details>
            ))}
          </div>
        </section>
      ),
      label: "手風琴（常見問題）",
    },
    // ==========================================
    // 資料表格
    // ==========================================
    DataTable: {
      fields: {
        caption: {
          type: "text",
          label: "表格標題（無障礙必填）",
        },
        headers: {
          type: "array",
          label: "欄位標題",
          arrayFields: {
            value: {
              type: "text",
              label: "標題文字",
            },
          },
          getItemSummary: (item) => item.value || "未命名欄位",
        },
        rows: {
          type: "array",
          label: "資料列",
          arrayFields: {
            cells: {
              type: "array",
              label: "儲存格",
              arrayFields: {
                value: {
                  type: "custom",
                  label: "內容",
                  render: ({ value, onChange }) => (
                    <RichTextField
                      value={typeof value === "string" ? value : ""}
                      onChange={(html) => onChange(html)}
                      label="內容"
                    />
                  ),
                },
              },
            },
          },
        },
      },
      defaultProps: {
        caption: "2024 年度銷售數據",
        headers: [
          { value: "月份" },
          { value: "營業額" },
          { value: "成長率" },
        ],
        rows: [
          {
            cells: [
              { value: "一月" },
              { value: "NT$ 1,200,000" },
              { value: "+15%" },
            ],
          },
          {
            cells: [
              { value: "二月" },
              { value: "NT$ 980,000" },
              { value: "-5%" },
            ],
          },
          {
            cells: [
              { value: "三月" },
              { value: "NT$ 1,450,000" },
              { value: "+22%" },
            ],
          },
        ],
      },
      render: ({ caption, headers = [], rows = [] }) => (
        <section className="max-w-4xl mx-auto py-12 px-6">
          <div
            className="overflow-x-auto rounded-lg"
            style={{ border: `1px solid ${colors.border}` }}
            role="region"
            aria-label={caption}
            tabIndex={0}
          >
            <table className="w-full border-collapse min-w-150">
              <caption
                className="px-6 py-4 text-left text-lg font-semibold"
                style={{
                  backgroundColor: colors.bgTertiary,
                  color: colors.textPrimary,
                }}
              >
                {caption}
              </caption>
              <thead>
                <tr style={{ backgroundColor: colors.bgSecondary }}>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="px-6 py-4 text-left text-base font-bold"
                      style={{
                        color: colors.textPrimary,
                        borderBottom: `2px solid ${colors.border}`,
                      }}
                    >
                      {header.value}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    style={{
                      backgroundColor:
                        rowIndex % 2 === 0
                          ? colors.bgPrimary
                          : colors.bgSecondary,
                    }}
                  >
                    {(row.cells ?? []).map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 text-base"
                        style={{
                          color: colors.textPrimary,
                          borderBottom: `1px solid ${colors.borderLight}`,
                        }}
                      >
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
        text: {
          type: "custom",
          label: "引言內容",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="引言內容"
            />
          ),
        },
        author: {
          type: "text",
          label: "作者姓名",
        },
        source: {
          type: "text",
          label: "出處（選填）",
        },
      },
      defaultProps: {
        text: "設計不只是外觀和感覺，設計是產品如何運作。",
        author: "史蒂夫·賈伯斯",
        source: "《紐約時報》訪談，2003年",
      },
      render: ({ text, author, source }) => (
        <figure className="max-w-3xl mx-auto py-12 px-6">
          <blockquote
            className="relative pl-8 text-xl md:text-2xl leading-relaxed italic"
            style={{
              color: colors.textPrimary,
              borderLeft: `4px solid ${colors.accent}`,
            }}
          >
            <div className="mb-4"><RichTextContent html={text} /></div>
          </blockquote>
          <figcaption className="pl-8 mt-4">
            <cite
              className="not-italic text-lg font-semibold"
              style={{ color: colors.textSecondary }}
            >
              — {author}
              {source && (
                <span
                  className="font-normal block mt-1"
                  style={{ color: colors.textMuted }}
                >
                  {source}
                </span>
              )}
            </cite>
          </figcaption>
        </figure>
      ),
      label: "引言區塊",
    },
    // ==========================================
    // 導覽卡片
    // ==========================================
    NavigationCard: {
      fields: {
        title: {
          type: "text",
          label: "標題",
        },
        description: {
          type: "custom",
          label: "描述",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="描述"
            />
          ),
        },
        linkUrl: {
          type: "text",
          label: "連結網址",
        },
        linkText: {
          type: "text",
          label: "連結文字",
        },
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
        title: "開始使用指南",
        description: "了解如何快速上手我們的產品，包含基本設定與常用功能介紹。",
        linkUrl: "/getting-started",
        linkText: "閱讀指南",
        iconType: "arrow",
      },
      render: ({ title, description, linkUrl, linkText, iconType }) => {
        const isExternal = iconType === "external";

        return (
          <article
            className="max-w-md mx-auto my-6 rounded-lg p-6 transition-shadow motion-reduce:transition-none hover:shadow-lg"
            style={{
              backgroundColor: colors.bgPrimary,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3
              className="text-xl font-bold mb-3"
              style={{ color: colors.textPrimary }}
            >
              {title}
            </h3>
            <div
              className="text-base mb-4 leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              <RichTextContent html={description} />
            </div>
            <a
              href={linkUrl}
              className="inline-flex items-center gap-2 text-lg font-semibold min-h-11 px-1 py-2 rounded transition-colors motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ color: colors.accent }}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              onFocus={(e) => {
                e.currentTarget.style.outlineColor = colors.accent;
              }}
            >
              <span className="underline underline-offset-4">{linkText}</span>
              <Icon type={iconType} size={20} />
              {isExternal && (
                <VisuallyHidden>（在新視窗開啟）</VisuallyHidden>
              )}
            </a>
          </article>
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
            { label: "警告訊息", value: "warning" },
            { label: "錯誤訊息", value: "error" },
          ],
        },
        title: {
          type: "text",
          label: "標題",
        },
        message: {
          type: "custom",
          label: "訊息內容",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="訊息內容"
            />
          ),
        },
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
        title: "系統公告",
        message: "網站將於 2024 年 12 月 31 日進行例行維護，預計維護時間為 2 小時。",
        dismissible: true,
      },
      render: ({ type, title, message, dismissible }) => {
        const typeStyles = {
          info: {
            bg: "#e8f4fd",
            border: colors.info,
            icon: "info",
          },
          success: {
            bg: "#e8f5e9",
            border: colors.success,
            icon: "check",
          },
          warning: {
            bg: "#fff8e1",
            border: colors.warning,
            icon: "info",
          },
          error: {
            bg: "#ffebee",
            border: colors.error,
            icon: "close",
          },
        };

        const style = typeStyles[type];
        const roleType = type === "error" ? "alert" : "status";
        const isDismissible = dismissible === true ;
        return (
          <div
            className="max-w-3xl mx-auto my-6 rounded-lg p-5"
            style={{
              backgroundColor: style.bg,
              borderLeft: `4px solid ${style.border}`,
            }}
            role={roleType}
            aria-live={type === "error" ? "assertive" : "polite"}
          >
            <div className="flex items-start gap-4">
              <span
                className="shrink-0 mt-0.5"
                style={{ color: style.border }}
                aria-hidden="true"
              >
                <Icon type={style.icon} size={24} />
              </span>
              <div className="flex-1">
                <h4
                  className="text-lg font-bold mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  {title}
                </h4>
                <div
                  className="text-base leading-relaxed"
                  style={{ color: colors.textSecondary }}
                >
                  <RichTextContent html={message} />
                </div>
              </div>
              {isDismissible && (
                <button
                  type="button"
                  className="shrink-0 p-2 rounded min-h-11 min-w-11 flex items-center justify-center transition-colors motion-reduce:transition-none focus:outline-none focus:ring-2"
                  style={{ color: colors.textSecondary }}
                  aria-label="關閉此訊息"
                  onClick={(e) => {
                    const banner = e.currentTarget.closest('[role]');
                    if (banner) {
                      (banner as HTMLElement).style.display = 'none';
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outlineColor = colors.accent;
                  }}
                >
                  <Icon type="close" size={20} />
                </button>
              )}
            </div>
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
        videoUrl: {
          type: "text",
          label: "影片網址（YouTube 或 Vimeo）",
        },
        title: {
          type: "text",
          label: "影片標題（無障礙必填）",
        },
        transcript: {
          type: "custom",
          label: "逐字稿（無障礙 AAA 必備）",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="逐字稿（無障礙 AAA 必備）"
            />
          ),
        },
      },
      defaultProps: {
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        title: "產品介紹影片",
        transcript:
          "這是影片的逐字稿內容。完整的逐字稿對於聽障使用者至關重要，也有助於搜尋引擎理解影片內容。\n\n[00:00] 開場白\n[00:30] 產品功能介紹\n[02:00] 使用方式說明\n[03:30] 結語",
      },
      render: ({ videoUrl, title, transcript }) => (
        <section className="max-w-4xl mx-auto py-12 px-6">
          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{
              paddingBottom: "56.25%", // 16:9 aspect ratio
              backgroundColor: colors.bgTertiary,
            }}
          >
            <iframe
              src={videoUrl}
              title={title}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          {transcript && (
            <details className="mt-6">
              <summary
                className="cursor-pointer text-lg font-semibold px-4 py-3 rounded min-h-11 flex items-center gap-2 transition-colors motion-reduce:transition-none focus:outline-none focus:ring-2"
                style={{
                  color: colors.accent,
                  backgroundColor: colors.bgSecondary,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outlineColor = colors.accent;
                }}
              >
                <Icon type="chevronDown" size={20} />
                顯示影片逐字稿
              </summary>
              <div
                className="mt-4 p-6 rounded-lg text-base leading-relaxed"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.textSecondary,
                }}
              >
                <RichTextContent html={transcript} />
              </div>
            </details>
          )}
        </section>
      ),
      label: "影片嵌入",
    },

    // ==========================================
    // 雙欄排版
    // ==========================================
    TwoColumnLayout: {
      fields: {
        leftContent: {
          type: "custom",
          label: "左欄內容",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="左欄內容"
            />
          ),
        },
        rightContent: {
          type: "custom",
          label: "右欄內容",
          render: ({ value, onChange }) => (
            <RichTextField
              value={typeof value === "string" ? value : ""}
              onChange={(html) => onChange(html)}
              label="右欄內容"
            />
          ),
        },
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
        leftContent: "這是左欄的內容。您可以在此放置文字、說明或其他資訊。",
        rightContent: "這是右欄的內容。雙欄排版有助於組織資訊，提升閱讀體驗。",
        ratio: "50-50",
      },
      render: ({ leftContent, rightContent, ratio }) => {
        const ratioClasses = {
          "50-50": "lg:grid-cols-2",
          "33-67": "lg:grid-cols-[1fr_2fr]",
          "67-33": "lg:grid-cols-[2fr_1fr]",
        };

        return (
          <section className="max-w-5xl mx-auto py-12 px-6">
            <div className={`grid grid-cols-1 gap-8 ${ratioClasses[ratio]}`}>
              <div
                className="text-lg leading-relaxed"
                style={{ color: colors.textPrimary }}
              >
                <RichTextContent html={leftContent} />
              </div>
              <div
                className="text-lg leading-relaxed"
                style={{ color: colors.textPrimary }}
              >
                <RichTextContent html={rightContent} />
              </div>
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
            { label: "裝飾性", value: "decorative" },
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
        const spacingClasses = {
          small: "my-6",
          medium: "my-12",
          large: "my-20",
        };

        const styleProps = {
          solid: {
            borderTop: `1px solid ${colors.border}`,
          },
          dashed: {
            borderTop: `2px dashed ${colors.borderLight}`,
          },
          decorative: {},
        };

        if (style === "decorative") {
          return (
            <div
              className={`max-w-3xl mx-auto px-6 ${spacingClasses[spacing]} flex items-center justify-center gap-4`}
              role={ariaHidden ? "presentation" : "separator"}
              aria-hidden={ariaHidden}
            >
              <span
                className="flex-1 h-px"
                style={{ backgroundColor: colors.borderLight }}
              />
              <span style={{ color: colors.textMuted }} aria-hidden="true">
                ◆
              </span>
              <span
                className="flex-1 h-px"
                style={{ backgroundColor: colors.borderLight }}
              />
            </div>
          );
        }

        return (
          <hr
            className={`max-w-3xl mx-auto ${spacingClasses[spacing]} border-0`}
            style={styleProps[style]}
            role={ariaHidden ? "presentation" : "separator"}
            aria-hidden={ariaHidden}
          />
        );
      },
      label: "分隔線",
    },

    // ==========================================
    // 功能列表
    // ==========================================
    FeatureList: {
      fields: {
        heading: {
          type: "text",
          label: "區塊標題",
        },
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
          label: "功能項目",
          arrayFields: {
            title: {
              type: "text",
              label: "功能名稱",
            },
            description: {
              type: "custom",
              label: "功能說明",
              render: ({ value, onChange }) => (
                <RichTextField
                  value={typeof value === "string" ? value : ""}
                  onChange={(html) => onChange(html)}
                  label="功能說明"
                />
              ),
            },
            icon: {
              type: "custom",
              render: ({ value, onChange }) => (
                  <IconPicker
                      value={typeof value === "string" ? value : ""}
                      onChange={(next) => onChange(next)}
                  />
              ),
            },
          },
        },
      },
      defaultProps: {
        heading: "我們的特色",
        headingLevel: "h2",
        items: [
          {
            title: "快速設定",
            description: "只需幾分鐘即可完成初始設定，立即開始使用。",
            icon: "io5:IoFlashOutline",
          },
          {
            title: "安全可靠",
            description: "採用業界最高標準的安全機制，保護您的資料。",
            icon: "io5:IoShieldCheckmarkOutline",
          },
          {
            title: "專業支援",
            description: "提供全天候技術支援，確保您的問題即時獲得解決。",
            icon: "io5:IoStarOutline",
          },
        ],
      },
      render: ({ heading, headingLevel, items }) => {
        const HeadingTag = headingLevel as 'h2' | 'h3' | 'h4';

        return (
          <section className="max-w-5xl mx-auto py-12 px-6">
            <HeadingTag
              className="text-2xl md:text-3xl font-bold mb-10 text-center"
              style={{ color: colors.textPrimary }}
            >
              {heading}
            </HeadingTag>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 list-none p-0">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="rounded-lg p-6"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    border: `1px solid ${colors.borderLight}`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: colors.accent,
                      color: colors.bgPrimary,
                    }}
                    aria-hidden="true"
                  >
                    {renderReactIcon(item.icon, 24)}
                  </div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ color: colors.textPrimary }}
                  >
                    {item.title}
                  </h3>
                  <div
                    className="text-base leading-relaxed"
                    style={{ color: colors.textSecondary }}
                  >
                    <RichTextContent html={item.description} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      },
      label: "功能列表",
    },
    // ==========================================
    // 檔案下載（多檔案清單）
    // ==========================================
    FileDownloads: {
      fields: {
        heading: { type: "text", label: "大標題" },
        description: { type: "textarea", label: "說明（選填）" },
        files: {
          type: "custom",
          label: "檔案清單",
          render: ({ value, onChange }) => (
              <div role="group" aria-label="檔案上傳與管理">
                <FileUploaderField
                    value={Array.isArray(value) ? value : []}
                    onChange={onChange}
                />
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
        heading: "檔案下載",
        description: "請點選下列檔案進行下載。",
        files: [
          {
            id: "file-1",
            name: "使用手冊.pdf",
            url: "/files/manual.pdf",
            size: "1.2MB",
            type: "pdf",
          },
          {
            id: "file-2",
            name: "範本.xlsx",
            url: "/files/template.xlsx",
            size: "320KB",
            type: "xls",
          },
        ],
        openInNewTab: false,
        enableDownloadAttr: true,
      },

      render: ({ heading, description, files, openInNewTab, enableDownloadAttr }) => {
        const typeLabelMap: Record<string, string> = {
          pdf: "PDF",
          doc: "Word",
          xls: "Excel",
          ppt: "PowerPoint",
          zip: "ZIP",
          image: "圖片",
          other: "檔案",
        };

        const toBool = (v: unknown) => v === true || v === "true";
        const _openInNewTab = toBool(openInNewTab);
        const _enableDownloadAttr = toBool(enableDownloadAttr);

        const target = _openInNewTab ? "_blank" : undefined;
        const rel = _openInNewTab ? "noopener noreferrer" : undefined;

        return (
            <section className="max-w-3xl mx-auto py-12 px-6">
              <header className="mb-6">
                <h2
                    className="text-2xl md:text-3xl font-bold"
                    style={{ color: colors.textPrimary }}
                >
                  {heading}
                </h2>
                {description ? (
                    <p className="mt-2 text-lg" style={{ color: colors.textSecondary }}>
                      {description}
                    </p>
                ) : null}
              </header>

              <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: `1px solid ${colors.border}` }}
              >
                {(!files || files.length === 0) ? (
                    <div className="p-6" style={{ backgroundColor: colors.bgPrimary }}>
                      <p className="text-base" style={{ color: colors.textSecondary }}>
                        尚未新增檔案。
                      </p>
                    </div>
                ) : (
                    <ul className="divide-y" style={{ backgroundColor: colors.bgPrimary }}>
                      {files.map((f, idx) => {
                        const typeLabel = typeLabelMap[f.type] ?? "檔案";
                        const downloadProps = _enableDownloadAttr
                            ? { download: f.name || true }
                            : {};

                        return (
                            <li key={f.id || `${idx}`} className="p-5">
                              <a
                                  href={f.url}
                                  target={target}
                                  rel={rel}
                                  {...downloadProps}
                                  className="group flex items-center justify-between gap-4 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                  style={{
                                    color: colors.textPrimary,
                                  }}
                                  aria-label={`下載檔案：${f.name || "附件"}`}
                                  onFocus={(e) => {
                                    e.currentTarget.style.outlineColor = colors.accentFocus;
                                  }}
                              >
                                <div className="min-w-0">
                                  <div className="text-lg font-semibold truncate">
                                    {f.name || "未命名檔案"}
                                  </div>
                                  <div
                                      className="text-sm mt-1"
                                      style={{ color: colors.textMuted }}
                                  >
                                    {typeLabel}{f.size ? ` · ${f.size}` : ""}
                                  </div>
                                </div>

                                <span
                                    className="shrink-0 inline-flex items-center gap-2 text-base font-semibold"
                                    style={{ color: colors.accent }}
                                    aria-hidden="true"
                                >
                        <Icon type="download" size={18} />
                        下載
                      </span>
                              </a>

                              {!f.url ? (
                                  <p className="mt-3 text-sm" style={{ color: colors.error }}>
                                    此檔案缺少 URL，請補上連結才能下載。
                                  </p>
                              ) : null}
                            </li>
                        );
                      })}
                    </ul>
                )}
              </div>
            </section>
        );
      },

      label: "檔案下載",
    },

  },
};

