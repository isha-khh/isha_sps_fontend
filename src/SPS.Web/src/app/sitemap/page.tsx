import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "網站導覽",
};

interface SiteUnitGroup {
  icon: string;
  title: string;
  links: { label: string; href: string }[];
}

/**
 * 「本站各單元連結」資料，對應設計稿 page/sitemap/index.html 的
 * `.sitmp_fx`。連結一律指向已經做出來的真頁面；還沒做出來的頁面
 * （例如服務專區底下的「產業AI」）維持設計稿原樣的 `#` 佔位連結。
 */
const SITE_UNIT_GROUPS: SiteUnitGroup[] = [
  {
    icon: "bi-diagram-3",
    title: "網站導覽",
    links: [{ label: "網站導覽說明", href: "/sitemap" }],
  },
  {
    icon: "bi-buildings",
    title: "關於我們",
    links: [{ label: "關於我們", href: "/about" }],
  },
  {
    icon: "bi-megaphone",
    title: "公告事項",
    links: [
      { label: "活動資訊", href: "/news?category=活動資訊" },
      { label: "產業新知", href: "/news?category=產業新知" },
      { label: "外部消息", href: "/news?category=外部消息" },
    ],
  },
];

const SERVICE_LINKS = [
  {
    label: "技術工具",
    href: "/serve",
    children: [
      { label: "產業AI", href: "#" },
      { label: "技術文件", href: "/serve" },
    ],
  },
  {
    label: "人才培育",
    href: "/talent",
    children: [
      { label: "知識加值", href: "/talent" },
      { label: "xr", href: "/talent/xr" },
    ],
  },
  {
    label: "產業輔導",
    href: "/tutoring",
    children: [{ label: "輔導", href: "/tutoring" }],
  },
  {
    label: "輔助資源",
    href: "/support",
    children: [
      { label: "本計畫補助", href: "/support" },
      { label: "政府補助資源", href: "/support/resources" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <>
      <BodyClass className="sitemap" />
      <InnerPageShell
        title="網站導覽"
        breadcrumb={[{ label: "網站導覽" }]}
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src={withBasePath("/images/home/round_6.png")} alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src={withBasePath("/images/home/round_3.jpg")} alt="" />
            </div>
          </>
        }
      >
        <div className="sitemap_box">
          <div className="sitemap_card mb-4" aria-labelledby="heading-sitemap-nav">
            <div className="card_header d-flex align-items-start">
              <div className="icon_wrap me-3 flex-shrink-0" aria-hidden="true">
                <i className="bi bi-file-earmark-text" />
              </div>
              <div className="header_content flex-grow-1">
                <h3 id="heading-sitemap-nav" className="card_title">
                  導覽區塊說明
                </h3>
                <p className="card_subtitle mb-0">本網站依無障礙網頁設計原則規劃，全站主要架構分為下列三大區塊：</p>
              </div>
            </div>

            <div className="nav_blocks_row row g-md-4 g-2 mt-2">
              <div className="col-12 col-md-4">
                <div className="nav_block_item">
                  <h4 className="block_title">1. 上方功能區塊</h4>
                  <p className="block_desc mb-0">網站導覽、企業搜尋、收藏、字體大小、常見QA</p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="nav_block_item">
                  <h4 className="block_title">2. 中央內容區塊</h4>
                  <p className="block_desc mb-0">網站主要內容與各單元資訊</p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="nav_block_item">
                  <h3 className="block_title">3. 下方功能區塊</h3>
                  <p className="block_desc mb-0">訂閱電子報、聯絡資訊、相關連結與版權宣告</p>
                </div>
              </div>
            </div>
          </div>

          <div className="sitemap_card mb-4" aria-labelledby="heading-sitemap-accesskey">
            <div className="card_header d-flex align-items-start">
              <div className="icon_wrap me-3 flex-shrink-0" aria-hidden="true">
                <i className="bi bi-grid-3x3" />
              </div>
              <div className="header_content flex-grow-1">
                <h3 id="heading-sitemap-accesskey" className="card_title">
                  快速鍵設定說明
                </h3>
                <p className="card_subtitle">
                  本網站加速規則遵循常見使用習慣，讓您快速瀏覽網站各主要功能：1. 上方功能區塊、2. 中央內容區塊、3. 下方功能區塊。
                </p>
                <p className="card_intro">本網站的快速鍵（Accesskey）設定如下：</p>

                <dl className="accesskey_list">
                  <div className="accesskey_row">
                    <dt className="accesskey_key">
                      <kbd>Alt</kbd> + <kbd>U</kbd>
                    </dt>
                    <dd className="accesskey_desc">在上方功能區塊，快速瀏覽網頁：網站導覽、聯絡資訊、字體調整等。</dd>
                  </div>
                  <div className="accesskey_row">
                    <dt className="accesskey_key">
                      <kbd>Alt</kbd> + <kbd>C</kbd>
                    </dt>
                    <dd className="accesskey_desc">中央內容區塊，為主要互動內容區。</dd>
                  </div>
                  <div className="accesskey_row">
                    <dt className="accesskey_key">
                      <kbd>Alt</kbd> + <kbd>B</kbd>
                    </dt>
                    <dd className="accesskey_desc">下方功能區塊。</dd>
                  </div>
                </dl>

                <div className="browser_tip" role="note">
                  <i className="bi bi-info-circle me-2" aria-hidden="true" />
                  <span>如果您打算開瀏覽器 Firefox，快速鍵可能無法透過 Shift+Alt+(快速鍵字母)，可改 Shift+Alt+C 嘗試並在單字中手動選擇，以此類推。</span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="xr_h card_title mb-3 mt-md-5 mt-4" id="heading-sitemap-units">
            <span>本站各單元連結</span>
          </h3>
          <div className="sitemap_card">
            <div className="sitmp_fx d-flex">
              {SITE_UNIT_GROUPS.map((group) => (
                <div className="unit_col" key={group.title}>
                  <div className="unit_group">
                    <div className="group_header d-flex align-items-center">
                      <span className="icon_circle me-2" aria-hidden="true">
                        <i className={`bi ${group.icon}`} />
                      </span>
                      <h4 className="group_title mb-0">{group.title}</h4>
                    </div>
                    <ul className="unit_links list-unstyled">
                      {group.links.map((link) => (
                        <li key={link.label}>
                          <a href={withBasePath(link.href)} title={`前往 ${link.label}`}>
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}

              <div className="unit_col">
                <div className="unit_group">
                  <div className="group_header d-flex align-items-center">
                    <span className="icon_circle me-2" aria-hidden="true">
                      <i className="bi bi-briefcase" />
                    </span>
                    <h4 className="group_title mb-0">服務專區</h4>
                  </div>
                  <ul className="unit_links list-unstyled">
                    {SERVICE_LINKS.map((group) => (
                      <li key={group.label}>
                        <a href={withBasePath(group.href)} title={`前往 ${group.label}`}>
                          {group.label}
                        </a>
                        <ul className="list-unstyled">
                          {group.children.map((child) => (
                            <li key={child.label}>
                              <a href={withBasePath(child.href)} title={`前往 ${child.label}`}>
                                {child.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="unit_col">
                <div className="unit_group">
                  <div className="group_header d-flex align-items-center">
                    <span className="icon_circle me-2" aria-hidden="true">
                      <i className="bi bi-bullseye" />
                    </span>
                    <h4 className="group_title mb-0">推廣專區</h4>
                  </div>
                  <ul className="unit_links list-unstyled">
                    <li>
                      <a href={withBasePath("/promotion")} title="前往 產業案例">
                        產業案例
                      </a>
                    </li>
                    <li>
                      <a href={withBasePath("/promotion/video")} title="前往 影音專區">
                        影音專區
                      </a>
                    </li>
                    <li>
                      <a href={withBasePath("/promotion/contribute")} title="前往 我要投稿">
                        我要投稿
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="unit_col">
                <div className="unit_group">
                  <div className="group_header d-flex align-items-center">
                    <span className="icon_circle me-2" aria-hidden="true">
                      <i className="bi bi-copy" />
                    </span>
                    <h4 className="group_title mb-0">我要媒合</h4>
                  </div>
                  <ul className="unit_links list-unstyled">
                    <li>
                      <a href={withBasePath("/matching/enterprise")} title="前往 企業名錄">
                        企業名錄
                      </a>
                    </li>
                    <li>
                      <a href={withBasePath("/matching")} title="前往 媒合對接">
                        媒合對接
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="unit_col">
                <div className="unit_group">
                  <div className="group_header d-flex align-items-center">
                    <span className="icon_circle me-2" aria-hidden="true">
                      <i className="bi bi-question-circle" />
                    </span>
                    <h4 className="group_title mb-0">常見問題</h4>
                  </div>
                  <ul className="unit_links list-unstyled">
                    <li>
                      <a href={withBasePath("/faq")} title="前往 常見問題">
                        常見問題
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="unit_col">
                <div className="unit_group">
                  <div className="group_header d-flex align-items-center">
                    <span className="icon_circle me-2" aria-hidden="true">
                      <i className="bi bi-person" />
                    </span>
                    <h4 className="group_title mb-0">會員中心</h4>
                  </div>
                  <ul className="unit_links list-unstyled">
                    <li>
                      <a href={withBasePath("/member/login")} title="前往 我要登入">
                        我要登入
                      </a>
                    </li>
                    <li>
                      <a href={withBasePath("/member/register")} title="前往 註冊會員">
                        註冊會員
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
