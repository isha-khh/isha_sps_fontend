import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect } from "react";

interface RichTextFieldProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
}

/**
 * Puck custom field：Tiptap WYSIWYG 富文字編輯器
 *
 * 支援：粗體、斜體、底線、刪除線、連結、有序/無序列表、縮排/退排、H2/H3
 * 值儲存為 HTML 字串，向下相容純文字（自動包成 <p>）
 */
export function RichTextField({ value, onChange, label }: RichTextFieldProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: toHtml(value),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 只在編輯器沒有焦點時才從外部同步（例如 Puck undo）
  // 編輯器有焦點時信任內部狀態，避免打字時游標跳掉
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editor.getHTML();
    const incoming = toHtml(value);
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("請輸入連結網址：");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-1 opacity-70">
          {label}
        </label>
      )}
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2px",
          padding: "4px",
          borderBottom: "1px solid #ddd",
          background: "#fafafa",
          borderRadius: "6px 6px 0 0",
          border: "1px solid #ddd",
        }}
      >
        <ToolBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="粗體"
        >
          <b>B</b>
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜體"
        >
          <i>I</i>
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="底線"
        >
          <u>U</u>
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="刪除線"
        >
          <s>S</s>
        </ToolBtn>

        <Separator />

        <ToolBtn
          active={editor.isActive("link")}
          onClick={toggleLink}
          title="連結"
        >
          🔗
        </ToolBtn>

        <Separator />

        <ToolBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="無序列表"
        >
          •
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="有序列表"
        >
          1.
        </ToolBtn>

        <Separator />

        <HeadingSelect editor={editor} />
      </div>

      {/* Editor area */}
      <div
        style={{
          border: "1px solid #ddd",
          borderTop: "none",
          borderRadius: "0 0 6px 6px",
          minHeight: "120px",
          maxHeight: "360px",
          overflowY: "auto",
        }}
      >
        <EditorContent
          editor={editor}
          style={{ padding: "8px 12px" }}
          className="rich-text-editor"
        />
      </div>

      {/* Inline styles for the editor content area */}
      <style>{`
        .rich-text-editor .tiptap {
          outline: none;
          min-height: 100px;
        }
        .rich-text-editor .tiptap p {
          margin: 0.4em 0;
        }
        .rich-text-editor .tiptap ul {
          list-style: disc;
          padding-left: 1.5em;
          margin: 0.4em 0;
        }
        .rich-text-editor .tiptap ol {
          list-style: decimal;
          padding-left: 1.5em;
          margin: 0.4em 0;
        }
        .rich-text-editor .tiptap h2 {
          font-size: 1.4em;
          font-weight: 700;
          margin: 0.6em 0 0.3em;
        }
        .rich-text-editor .tiptap h3 {
          font-size: 1.2em;
          font-weight: 600;
          margin: 0.5em 0 0.3em;
        }
        .rich-text-editor .tiptap h4 {
          font-size: 1.1em;
          font-weight: 600;
          margin: 0.4em 0 0.25em;
        }
        .rich-text-editor .tiptap h5 {
          font-size: 1em;
          font-weight: 600;
          margin: 0.4em 0 0.2em;
        }
        .rich-text-editor .tiptap a {
          color: #2563eb;
          text-decoration: underline;
        }
        .rich-text-editor .tiptap s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}

/* ---- Sub-components ---- */

function ToolBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        if (!disabled) onClick();
      }}
      title={title}
      disabled={disabled}
      style={{
        padding: "2px 8px",
        fontSize: "13px",
        lineHeight: "24px",
        borderRadius: "4px",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        background: active ? "#e0e7ff" : "transparent",
        color: disabled ? "#bbb" : active ? "#3730a3" : "#333",
        fontWeight: active ? 700 : 500,
        minWidth: "28px",
        textAlign: "center",
      }}
    >
      {children}
    </button>
  );
}

function HeadingSelect({ editor }: { editor: Editor }) {
  const current =
    ([2, 3, 4, 5] as const).find((lvl) =>
      editor.isActive("heading", { level: lvl })
    ) ?? "";

  return (
    <select
      value={current}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") {
          // 選「內文」→ 清除 heading，回到段落
          editor.chain().focus().setParagraph().run();
        } else {
          const level = Number(val) as 2 | 3 | 4 | 5;
          editor.chain().focus().toggleHeading({ level }).run();
        }
      }}
      title="標題層級"
      style={{
        padding: "2px 4px",
        fontSize: "13px",
        lineHeight: "24px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        background: current ? "#e0e7ff" : "transparent",
        color: current ? "#3730a3" : "#333",
        fontWeight: current ? 700 : 500,
        cursor: "pointer",
        outline: "none",
      }}
    >
      <option value="">內文</option>
      <option value="2">H2</option>
      <option value="3">H3</option>
      <option value="4">H4</option>
      <option value="5">H5</option>
    </select>
  );
}

function Separator() {
  return (
    <span
      style={{
        width: "1px",
        background: "#ddd",
        margin: "2px 4px",
        alignSelf: "stretch",
      }}
    />
  );
}

/* ---- Helpers ---- */

/**
 * 向下相容：如果值是純文字（不含 HTML 標籤），自動轉換為 <p> 段落
 */
function toHtml(value: string | undefined | null): string {
  if (!value) return "<p></p>";
  // If it already contains HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  // Plain text → wrap paragraphs (split on double newline)
  return value
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
