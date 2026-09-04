import type { Config, Slot } from "@puckeditor/core";
import ZoomableImage from "@/components/ui/ZoomableImage";
import LinkListBox from "@/components/news/LinkListBox";
import ArticleContactInfo from "@/components/news/ArticleContactInfo";
import type { LinkListItem } from "@/lib/news-data";

/**
 * 公告內文用的 Puck 區塊定義。
 *
 * 跟 docs/puck-content-blocks.md 記錄的第一版（14 個通用 Tailwind 佔位
 * 區塊）不是同一套——那份是從別的專案帶過來的架構參考，這份改成只用
 * 「這個專案已經有、公告內文真的用得到」的東西：
 *
 * - `ArticleParagraph` 對應現有 `.editor` 這組 CSS（見
 *   coreStyle.css 的 `.editor`／`.editor img`），公告內文本來就是
 *   CKEditor 這類所見即所得編輯器輸出的 HTML，這裡用 Puck 內建的
 *   richtext 欄位（裡面包了一份 tiptap）扮演一樣的角色，輸出格式
 *   完全相容
 * - `ArticleImage` 直接沿用專案既有的 [ZoomableImage](../../components/ui/ZoomableImage.tsx)
 *   元件（點圖放大燈箱），不是重新刻一顆圖片元件
 * - `Contributor`／`FileDownloads`／`RelatedLinks`／`ContactInfo` 對應
 *   詳情頁標題下方跟內文下方那幾塊固定資訊（撰稿人、附件下載、相關
 *   連結、聯繫人資訊）——原本這幾塊是寫死在 news/[id]/page.tsx 裡、
 *   不屬於可編輯範圍，現在一起併進 Puck 的 content 陣列，變成可以
 *   拖曳排序/編輯的區塊。`ContactInfo` 是協會固定聯絡資訊，不是
 *   每篇文章各自不同的欄位（見 ArticleContactInfo.tsx 的註解），所以
 *   沒有可編輯欄位，放進來純粹是讓編輯畫面看到的順序跟前台一致
 * - `SupplementaryInfo` 是上面那三個的外框容器，對應舊站 `.dk_conbo`
 *   這個 class——它不是單純的排版包裝，`style.css` 裡有實際的裝飾樣式
 *   （圓角、上下漸層遮罩邊框），拿掉這層外框畫面會整個走樣。一開始
 *   漏了這層，把三個區塊直接攤平放進 content 陣列，結果畫面上少了
 *   這圈外框——用 `slot` 欄位重建這個容器，把三個區塊放進它的插槽裡，
 *   render 出來才會是 `<div className="dk_conbo">{三個區塊}</div>`
 *
 * 其餘 docs/puck-content-blocks.md 列的區塊（手風琴、表格、CTA…）
 * 公告內文目前沒有對應設計，先不做，等設計稿出來再加──不要為了
 * 「湊滿 14 個」硬套通用樣式上線。
 */
type Props = {
  ArticleParagraph: {
    content: string;
  };
  ArticleImage: {
    src: string;
    alt: string;
    caption: string;
  };
  Contributor: {
    name: string;
  };
  FileDownloads: {
    items: LinkListItem[];
  };
  RelatedLinks: {
    items: LinkListItem[];
  };
  ContactInfo: Record<string, never>;
  SupplementaryInfo: {
    items: Slot;
  };
};

export const puckConfig: Config<Props> = {
  categories: {
    content: {
      title: "公告內容",
      defaultExpanded: true,
      components: ["Contributor", "ArticleParagraph", "ArticleImage"],
    },
    attachments: {
      title: "附屬資訊",
      defaultExpanded: true,
      components: ["SupplementaryInfo", "FileDownloads", "RelatedLinks", "ContactInfo"],
    },
  },

  components: {
    Contributor: {
      label: "撰稿人",
      fields: {
        name: { type: "text", label: "撰稿人姓名／單位" },
      },
      defaultProps: {
        name: "",
      },
      render: ({ name }) => <>{name && <div className="Contributor">撰稿人 / {name}</div>}</>,
    },

    ArticleParagraph: {
      label: "文章段落",
      fields: {
        // Puck 內建的 richtext 欄位就是包了一份 tiptap 進去，不用自己
        // 再刻一顆富文本輸入框——存出來的還是 HTML 字串，跟現有
        // `.editor` + dangerouslySetInnerHTML 那套完全相容。
        content: { type: "richtext", initialHeight: 240 },
      },
      defaultProps: {
        content: "<p>請輸入公告內容……</p>",
      },
      render: ({ content }) => <div className="txt editor mb-md-5 mb-4">{content}</div>,
    },

    ArticleImage: {
      label: "圖片",
      fields: {
        src: { type: "text", label: "圖片網址" },
        alt: { type: "text", label: "替代文字（無障礙必填）" },
        caption: { type: "text", label: "圖說（選填，點圖可放大）" },
      },
      defaultProps: {
        src: "/images/all/new_logo.jpg",
        alt: "",
        caption: "",
      },
      render: ({ src, alt, caption }) =>
        src ? (
          <ZoomableImage src={src} alt={alt} caption={caption || undefined} className="mb-md-5 mb-4" />
        ) : (
          <p className="text-muted mb-md-5 mb-4">（尚未設定圖片網址）</p>
        ),
    },

    FileDownloads: {
      label: "附件下載",
      fields: {
        items: {
          type: "array",
          label: "檔案清單",
          arrayFields: {
            label: { type: "text", label: "顯示文字（檔名）" },
            href: { type: "text", label: "連結網址" },
          },
          getItemSummary: (item) => item.label || "未命名檔案",
        },
      },
      defaultProps: {
        items: [],
      },
      render: ({ items }) => <LinkListBox icon="bi-file-earmark-arrow-down" title="附件下載" items={items} />,
    },

    RelatedLinks: {
      label: "相關連結",
      fields: {
        items: {
          type: "array",
          label: "連結清單",
          arrayFields: {
            label: { type: "text", label: "顯示文字" },
            href: { type: "text", label: "連結網址" },
          },
          getItemSummary: (item) => item.label || "未命名連結",
        },
      },
      defaultProps: {
        items: [],
      },
      render: ({ items }) => <LinkListBox icon="bi-link-45deg" title="相關連結" items={items} />,
    },

    ContactInfo: {
      label: "聯繫人資訊（協會固定資料，無可編輯欄位）",
      fields: {},
      defaultProps: {},
      render: () => <ArticleContactInfo />,
    },

    SupplementaryInfo: {
      label: "附屬資訊外框",
      fields: {
        items: {
          type: "slot",
          // 只允許附件下載／相關連結／聯繫人資訊這三種放進來，避免編輯
          // 不小心把文章段落之類的東西拖進這個外框裡。
          allow: ["FileDownloads", "RelatedLinks", "ContactInfo"],
        },
      },
      render: ({ items: Items }) => (
        <div className="dk_conbo mb-md-5 mb-4">
          <Items />
        </div>
      ),
    },
  },
};
