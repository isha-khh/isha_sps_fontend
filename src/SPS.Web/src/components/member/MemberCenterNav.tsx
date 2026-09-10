export type MemberCenterSection =
  | "profile"
  | "password"
  | "passkey"
  | "company"
  | "contact"
  | "product"
  | "upgrade"
  | "match_data"
  | "favorite";

export interface MemberCenterNavGroup {
  groupLabel: string;
  items: { key: MemberCenterSection; label: string }[];
}

/**
 * 會員中心側邊欄的分組/項目——功能範圍照抄舊專案
 * （`~/RiderProjects/isha-sps/src/SPS.Web` 的 `InfoContent.tsx`）
 * 已經設計好的那套分類，只是這邊只有「基本資料」真的接了真資料
 * （`ProfilePanel.tsx`），其他項目先顯示「即將推出」佔位內容，見
 * `MemberCenterContent.tsx` 的說明。「權益升級」是這次新加的項目
 * （對應 docs/改版規劃.md 的 Phase 2 規劃，還沒開始做）。
 */
export const MEMBER_CENTER_NAV_GROUPS: MemberCenterNavGroup[] = [
  {
    groupLabel: "個人資料管理",
    items: [
      { key: "profile", label: "基本資料" },
      { key: "password", label: "變更密碼" },
      { key: "passkey", label: "Passkey 管理" },
    ],
  },
  {
    groupLabel: "企業會員專屬",
    items: [
      { key: "company", label: "公司資料" },
      { key: "contact", label: "成員管理" },
      { key: "product", label: "產品相關資訊" },
      { key: "upgrade", label: "權益升級" },
    ],
  },
  {
    groupLabel: "媒合",
    items: [
      { key: "match_data", label: "媒合資料維護" },
      { key: "favorite", label: "我的最愛" },
    ],
  },
];

/**
 * 積木元件：會員中心側邊欄——沿用 `.side .nav`（`CategorySidebar`／
 * `CategoryTabList` 也是這套，News/Serve 側欄分類選單）既有樣式，
 * 保持全站側欄視覺一致，不是另外刻一套新樣式。
 *
 * 用 `<a href="#" onClick={preventDefault + 切換}>` 而不是真的
 * `<Link>` 導頁：會員中心是單頁式的分頁切換（跟舊專案
 * `InfoContent.tsx` 的 `active` state 做法一樣），不是每個分類各自
 * 一個路由——`.side .nav > li a` 這組 CSS 是照 `<a>` 標籤選的，用
 * `<a>` 只是為了套上一樣的視覺，不是真的要導頁，所以要
 * `preventDefault()`。
 */
export default function MemberCenterNav({
  active,
  onSelect,
}: {
  active: MemberCenterSection;
  onSelect: (section: MemberCenterSection) => void;
}) {
  return (
    <>
      {MEMBER_CENTER_NAV_GROUPS.map((group) => (
        <div key={group.groupLabel} className="mb-4">
          <h4 className="me_sho mb-2">{group.groupLabel}</h4>
          <ul className="nav wid-cont">
            {group.items.map((item) => (
              <li key={item.key}>
                <a
                  href="#"
                  title={item.label}
                  className={item.key === active ? "active" : undefined}
                  aria-current={item.key === active ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(item.key);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
