# 公告內容編輯器：Puck 架構對齊筆記

> 對應需求：「公告」頁面的內容想改用區塊化編輯（像 Notion/WordPress 的 block editor），
> 技術上考慮用 [Puck](https://github.com/puckeditor/puck)。這份文件先把 Puck 的架構
> 觀念對齊，再盤點 `src/lib/puck`、`src/components/puck` 底下已經放的 14 個區塊，
> 哪些「功能」有了、哪些「視覺設計」還沒切版。

## 0. 現況一句話總結

`src/lib/puck/config.tsx` 已經把使用者列的 **14 個區塊全部功能性地實作出來**
（資料欄位、預設值、渲染邏輯都有），是從另一個專案帶過來的**架構參考範本**（不是要
直接沿用的成品）——裡面 import 了這個專案完全沒有安裝、也不存在的套件/檔案，**目前
狀態下連 `tsc` 都過不了**（詳見第 3 節），視覺上也全部是通用 Tailwind 佔位樣式。

更重要的是對照「公告」本身現有設計後發現（詳見第 4 節）：公告內文從舊站到現在都是
**CKEditor 這種傳統 WYSIWYG 編輯器自由排版出來的 HTML**，實際內容幾乎全部是純文字
段落，對應的 CSS（`.editor`）也只定義了「段落文字」跟「滿版置中圖」兩種樣式。也就是說
14 個區塊裡，**只有「文章段落」跟「圖片區塊（最陽春版）」有現成設計可以沿用，其餘
11 個在公告內文這個場景裡完全沒被設計過**，不是「還沒搬過來」，是「本來就沒有」，需要
設計師針對「公告可插入區塊」這個新功能從零出圖。

---

## 1. Puck 核心架構對照

Puck 是「給定一份 `Config`（描述有哪些區塊、每個區塊有哪些可編輯欄位、怎麼渲染），
就能生出一個拖拉式編輯器 + 對應的唯讀渲染器」的套件。跟這個專案目前的積木
（`src/components/**`）不衝突——Puck 的每個「區塊」骨子裡就是一個 React 元件，只是
多包了一層「欄位定義」讓後台使用者不用寫程式就能填內容、調整版面。

### 1.1 `Config` 物件

```ts
const config: Config<Props> = {
  categories: { ... },   // 選填：左側元件面板怎麼分類分組
  components: { ... },   // 必填：每個區塊的定義
  root: { ... },         // 選填：包住整棵樹的最外層（例如公告的 <article> 容器）
};
```

### 1.2 每個區塊（`ComponentConfig`）長怎樣

```ts
HeroBlock: {
  label: "大標題區塊",         // 編輯器面板顯示的名稱
  fields: { ... },            // 後台要顯示哪些輸入欄位
  defaultProps: { ... },      // 拖進畫布時的預設內容
  render: (props) => <... />, // 這些欄位值怎麼變成畫面
}
```

`fields` 支援的型別：`text`、`textarea`、`number`、`select`、`radio`、
`array`（可重複的清單，例如手風琴的每一條問答）、`object`、`custom`（欄位 UI 完全自己刻，
這份 prototype 大量用這個接 `RichTextField`／`ImageUploadField`／`IconPicker`）。

### 1.3 資料格式（存進 DB／API 的 JSON 長怎樣）

```ts
type Data = {
  root: { props: Record<string, unknown> };
  content: Array<{
    type: string;              // 對應 config.components 的 key，例如 "HeroBlock"
    props: Record<string, unknown>;
  }>;
};
```

也就是一篇公告 = 一個 `Data`，`content` 是一排區塊，每個區塊記錄「用了哪個 type」+
「這個實例填了什麼 props」。這份 JSON 就是要存進後台資料庫的內容欄位。

### 1.4 兩種渲染模式

- `<Puck config data onChange onPublish>`：**後台編輯器**，給小編拖拉、調欄位用的，
  已經包在 [`PuckEditor.tsx`](../src/components/puck/PuckEditor.tsx)。
- `<Render config data>`：**前台唯讀渲染**，把存好的 `Data` 轉成最終畫面，已經包在
  [`PuckRenderer.tsx`](../src/components/puck/PuckRenderer.tsx)。

兩種都吃同一份 `config`——這是 Puck 的重點：**區塊的「視覺長相」只寫一次**（`render`
函式），編輯器預覽跟前台實際顯示用的是同一段渲染邏輯，不會有「後台看起來一樣、前台跑出來
不一樣」的問題。所以之後要把 14 個區塊換成 SPS 真正的視覺設計，只要改
`src/lib/puck/config.tsx` 裡每個區塊的 `render`，編輯器跟前台會一起更新。

---

## 2. 現有檔案盤點

```
src/lib/puck/
  config.tsx      # 14 個區塊的 fields/defaultProps/render 全部定義在這
  ionicons.tsx     # FeatureList 圖示挑選用，把 react-icons 幾個 icon set 包成一個查表

src/components/puck/
  PuckEditor.tsx        # 後台編輯器包裝（全螢幕/預覽切換、onChange/onPublish）
  PuckRenderer.tsx       # 前台唯讀渲染包裝，含「舊格式內容」相容判斷
  RichTextField.tsx      # config 裡大量 custom field 用的富文本輸入框（tiptap）
  RichTextContent.tsx    # 富文本 HTML 的唯讀顯示
  ImageUploadField.tsx   # 圖片上傳欄位
  FileUploaderField.tsx  # 檔案下載區塊用的多檔案上傳欄位
  IconPicker.tsx         # FeatureList 圖示選擇器
  Icon.tsx               # 內建幾顆 SVG icon（箭頭/下載/資訊等，NavigationCard/AlertBanner用）
  VisuallyHidden.tsx     # 無障礙用的視覺隱藏文字
  theme.ts               # 目前 14 個區塊共用的一份佔位色票（跟 SPS 網站色系無關）
```

## 3. ⚠️ 目前的落地狀態：還沒接進這個專案

這批檔案是直接從別的專案帶過來的參考範本，會被下列問題卡住，**目前完全沒有被
`app/` 底下任何頁面引用**（`grep` 不到任何 import），`package.json` 也還沒裝對應套件：

| 缺什麼 | 用在哪裡 | 這個專案目前狀態 |
| --- | --- | --- |
| `@puckeditor/core` | `PuckEditor.tsx`、`PuckRenderer.tsx`、`config.tsx` | 完全沒裝，`npm run build` 目前沒炸是因為沒人 import 這些檔案 |
| `@tiptap/react`、`@tiptap/starter-kit`、`@tiptap/extension-underline`、`@tiptap/extension-link` | `RichTextField.tsx` | 沒裝 |
| `react-icons`（io / io5 / bs / lu） | `ionicons.tsx`、`IconPicker.tsx` | 沒裝 |
| `@/lib/api/files-management` | `ImageUploadField.tsx`、`FileUploaderField.tsx` | 這個檔案不存在（原專案的後端 API client） |
| `@/components/shared/FilePickerModal` | 同上 | 不存在 |
| `@/types/files` | 同上 | 不存在 |

實測直接跑 `npx tsc --noEmit` 會有 60+ 個型別錯誤，都是上面這幾個缺失的模組
+ 一些沒補型別註記的參數（`implicitly has an 'any' type'`）。`next build` 現在能過，
純粹是 Next.js 只型別檢查真的被頁面引用到的檔案，這批孤兒檔案沒人 import，暫時被放過
而已——**一旦哪個頁面開始 `import PuckEditor`，build 馬上會炸**，這點之後接線時要注意。

另外 `theme.ts` 裡的色票（`textPrimary: #1a1a1a` 等）跟 SPS 網站現有的藍色系
（`#2467B2`／`#1891AF`，見 [globals.css](../src/app/globals.css)、
[coreStyle.css](../public/css/coreStyle.css)）完全無關，是抄範本時一起帶過來的
placeholder，之後要嘛整份重寫、要嘛乾脆讓每個區塊的 `render` 直接吃 legacy CSS
的 class（跟這次遷移專案其他積木一樣的做法），不要再維護一份獨立色票。

---

## 4. 14 個區塊盤點表（對照「公告」本身現有的設計，不是全站亂找）

第一版這裡犯了一個錯：把首頁 CTA、影片輪播卡片這類「其他頁面各自專屬的版型」也
算進「可參考視覺」，但那些的脈絡、用途都跟「公告內文可以放什麼」無關，會誤導判斷。
這裡改成只看**公告本身**目前真正的設計——也就是舊站 [page/news/show.html](../../../page/news/show.html)
（公告詳情頁的原始切版）跟遷移過來的 [news/[id]/page.tsx](../src/app/news/[id]/page.tsx)。

關鍵發現：這兩邊程式碼裡都寫了同一件事——`.txt.editor` 這個 div 裡的內容，是
**CKEditor 這套傳統 WYSIWYG 編輯器直接輸出的 HTML**（[news/[id]/page.tsx:128](../src/app/news/[id]/page.tsx#L128)
的註解就直接寫「CMS 編輯器（CKEditor）產出的 HTML」）。也就是說**公告內文從來不是
「區塊拼裝」的概念**，是小編在一個所見即所得的文字方塊裡自由排版，出來的東西幾乎全部
是純 `<p>` 段落（[news-data.ts](../src/lib/news-data.ts) 裡三筆範例公告的 `bodyHtml` 全部只有
`<p>`，舊站 `show.html` 的範例內容也是）。對應的 CSS（`coreStyle.css` 第 2411 行的
`.editor`）也只定義了兩條規則：

```css
.editor { font-size: 16px; line-height: 31px; color: #000; }
.editor img { max-width: 100%; margin: 0 auto; display: block; }
```

**沒有任何一條規則是給表格、引言、手風琴、警示區塊、影片、雙欄排版用的**——不是
CSS 檔案裡剛好沒寫，是公告內文這個場景從頭到尾就只設計過「文字段落 + 偶爾夾一張滿版
圖片」這兩種東西。

（公告內文下方那三塊「附件下載」「相關連結」「聯繫人資訊」——也就是舊站的
`.dot`/`.link`/`.cont`——已經是獨立切好版、也遷移完成的固定區塊，見
[LinkListBox.tsx](../src/components/news/LinkListBox.tsx)、
[ArticleContactInfo.tsx](../src/components/news/ArticleContactInfo.tsx)。但這幾個是「文章
結構固定會有的附屬區塊」，不是使用者能自由拖進內文、想放幾個放幾個的東西，性質上
比較適合維持現狀（獨立欄位），不見得需要塞進 Puck 的可拖拉內容區——這點也列進下一步
建議一起讓設計師/PM 確認。）

| # | 使用者列的名稱 | `config.tsx` 裡的 key | 功能面（欄位/資料模型） | 目前樣式（`config.tsx`） | 公告本身現有設計 |
| - | --- | --- | :-: | --- | --- |
| 1 | 大標題區塊 | `HeroBlock` | ✅ 完成 | 通用 Tailwind 置中標題 | ❌ 沒有：公告本身的大標題（`<h3>{title}</h3>`）是頁面模板固定產生的，不是內文裡能插入的區塊，沒有「內文中間插一個大標題」的設計前例 |
| 2 | 文章段落 | `ArticleContent` | ✅ 完成 | 通用 Tailwind 內文排版 | ✅ 有：就是 `.editor` 這組樣式本身，字級 16px／行高 31px／黑字，直接沿用即可 |
| 3 | 圖片區塊 | `ImageFeature` | ✅ 完成 | 通用 Tailwind 左右圖文 | 只有極簡單的前例：`.editor img { max-width:100%; display:block }`，等於「滿版置中圖」。**沒有**「圖說文字」「圖左文右／圖右文左」這些排版的設計，是這次要新設計的部分 |
| 4 | 行動呼籲 | `CallToAction` | ✅ 完成 | 通用 Tailwind 置中按鈕區 | ❌ 沒有：公告內文裡從來沒有出現過按鈕，需要全新設計 |
| 5 | 手風琴 | `Accordion` | ✅ 完成 | 通用 Tailwind `<details>` | ❌ 沒有：公告內文裡沒有手風琴，舊站別處雖有 `.accordion-list`（例如 FAQ 頁），但那是完全不同頁面的元件，不是公告內文設計，不建議直接套用 |
| 6 | 資料表格 | `DataTable` | ✅ 完成 | 通用 Tailwind table | ❌ 沒有：`.editor` 沒有任何 `table` 樣式規則 |
| 7 | 引言區塊 | `Quote` | ✅ 完成 | 通用 Tailwind blockquote | ❌ 沒有 |
| 8 | 導覽卡片 | `NavigationCard` | ✅ 完成 | 通用 Tailwind 卡片 | ❌ 沒有 |
| 9 | 警示橫幅 | `AlertBanner` | ✅ 完成 | 通用 Tailwind 色塊 | ❌ 沒有 |
| 10 | 影片嵌入 | `VideoEmbed` | ✅ 完成 | 通用 Tailwind 16:9 iframe | ❌ 沒有：公告內文從沒嵌過影片 |
| 11 | 雙欄排版 | `TwoColumnLayout` | ✅ 完成 | 通用 Tailwind grid | ❌ 沒有：公告內文一律單欄 |
| 12 | 分隔線 | `Divider` | ✅ 完成 | 通用 Tailwind hr | ❌ 沒有 |
| 13 | 功能列表 | `FeatureList` | ✅ 完成 | 通用 Tailwind 三欄卡片網格 | ❌ 沒有 |
| 14 | 檔案下載 | `FileDownloads` | ✅ 完成（但吃的是還不存在的上傳 API，見第 3 節） | 通用 Tailwind 清單 | ❌ 沒有：現有「附件下載」是文章結構固定的附屬區塊（見上方說明），不是內文裡能插入的區塊，用途不同，不能當作這個 block 的設計依據 |

**小結（修正後）**：14 個裡面只有 **文章段落（#2）** 有現成、明確可以直接沿用的設計
（`.editor` 那兩條 CSS 規則）；**圖片區塊（#3）** 只有「滿版置中圖」這個最小前例，圖說
／左右圖文排版都要新設計。**其餘 11 個區塊，公告內文這個場景裡完全沒有出現過，需要
設計師從零出圖**——這才是「大部分還沒切版」真正的意思：不是舊站別處有、只是還沒搬過來，
而是公告內文從來就沒被設計成可以放這些東西。

---

## 5. 下一步建議

1. **先決定要不要真的採用 Puck**：目前只有一份沒裝套件、過不了 `tsc` 的參考範本，
   還沒有實際驗證過 `@puckeditor/core` 在這個 Next.js 16 + Tailwind v4 + React 19
   的組合下能不能順利跑起來（新版 React/Next 有時候會跟這類套件的 peer dependency
   對不上）。建議先裝套件、接一個最小可行頁面（例如 `/admin/announcement-editor`）
   實際跑一次 `<Puck>`，確認相容性沒問題，再往下投資。
2. **拆解依賴**：`ImageUploadField`/`FileUploaderField` 目前綁死在不存在的
   `files-management` API 上，要嘛先做一個最小版本的檔案上傳 API，要嘛先用
   `<input type="file">` 佔位，之後再換掉。
3. **換皮**：14 個區塊的 `render` 要逐一從「通用 Tailwind」換成「吃 legacy CSS
   class／SPS 設計 token」，跟這次遷移專案其他積木（`src/components/**`）的作法
   一致——保留舊站 CSS，結構轉 React，而不是整個重新設計一套 Tailwind 版型。
4. **等設計稿**：上面表格列「❌ 沒有」的 11 個區塊（大標題、行動呼籲、手風琴、
   資料表格、引言區塊、導覽卡片、警示橫幅、影片嵌入、雙欄排版、分隔線、功能列表），
   公告內文這個場景完全沒有設計前例，需要請設計師針對「公告內文可插入區塊」出圖——
   這是目前真正卡住、不能只憑現有頁面推敲樣式的部分。只有文章段落跟陽春版圖片區塊
   可以先用現有 `.editor` 樣式動工，其他建議先出圖再刻。
