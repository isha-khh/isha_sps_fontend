import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import ShareBox from "@/components/ui/ShareBox";
import MoreLink from "@/components/ui/MoreLink";
import PopularCourses from "@/components/talent/PopularCourses";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import { TALENT_COURSES, getTalentCourse } from "@/lib/talent-data";
import { withBasePath } from "@/lib/api-client";

// 說明見 talent/page.tsx 同一份假資料的註解
const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

export function generateStaticParams() {
  return TALENT_COURSES.map((course) => ({ id: course.id }));
}

// 說明見 serve/[id]/page.tsx 同一行的註解：目前是固定假資料，不在
// 名單裡的 id 直接在路由層級當 404。
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/talent/[id]">): Promise<Metadata> {
  const { id } = await params;
  const course = getTalentCourse(id);
  return { title: course?.title ?? "找不到頁面" };
}

const INFO_ROWS = (course: NonNullable<ReturnType<typeof getTalentCourse>>) => [
  { icon: "bi-tag", term: "課程代號", desc: course.courseCode },
  { icon: "bi-calendar-event", term: "課程日期", desc: course.courseDate },
  { icon: "bi-clock", term: "課程時間", desc: course.courseTime },
  { icon: "bi-hourglass-split", term: "總時數", desc: course.totalHours },
  { icon: "bi-currency-dollar", term: "課程費用", desc: course.fee, danger: true },
  { icon: "bi-person", term: "適合對象", desc: course.audience },
  { icon: "bi-geo-alt", term: "上課地點", desc: course.location },
  { icon: "bi-building", term: "主辦單位", desc: course.hostOrganizer },
  { icon: "bi-building", term: "執行單位", desc: course.executor },
];

/**
 * 人才培訓課程詳情頁，對應設計稿 page/talent/show.html。目前後端
 * 沒有對應的內容類型，先用固定假資料，`course-info-card` 是這頁
 * 特有的課程資訊表格（跟 news/serve 詳情頁的 meta 清單不同版型）。
 */
export default async function TalentShowPage({ params }: PageProps<"/talent/[id]">) {
  const { id } = await params;
  const course = getTalentCourse(id);

  if (!course) {
    notFound();
  }

  const rows = INFO_ROWS(course);

  return (
    <>
      <BodyClass className="talent show" />
      <InnerPageShell
        breadcrumb={[{ label: "人才培育" }, { label: "人才培訓", href: "/talent" }, { label: course.title }]}
        aside={
          <>
            <PopularCourses courses={TALENT_COURSES} />
            <SidebarBanner items={SIDEBAR_BANNERS} />
          </>
        }
      >
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <h3>{course.title}</h3>

              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="tag-wrap">
                    <span className="badge-tag mb-0">技術公具</span>
                  </div>
                  <div className="part-line"></div>
                </div>

                <ShareBox />
              </div>
            </div>

            {course.keywords.length > 0 && (
              <ul className="nav ul-key">
                {course.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dk_conbo mb-md-5 mb-4">
            <div className="course-info-card">
              <div className="dow-name">
                <i className="bi bi-book me-1" />
                <span>課程資訊</span>
              </div>

              <dl className="course-info-list mb-0">
                {rows.map((row, index) => (
                  <div className={`info-row${index % 2 === 1 ? " bg-stripe" : ""}`} key={row.term}>
                    <dt className="info-term">
                      <i className={`bi ${row.icon} icon-blue`} aria-hidden="true" />
                      <span className="term-text">{row.term}</span>
                    </dt>
                    <dd className={`info-desc${row.danger ? " text-danger fw-bold" : ""}`}>{row.desc}</dd>
                  </div>
                ))}
              </dl>

              <a href="#" title="立即報名" className="more_x more_x_gu mt-4">
                <span>立即報名</span>
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="txt editor mb-md-5 mb-4" dangerouslySetInnerHTML={{ __html: course.bodyHtml }} />

          <div className="d-flex sign_ta">
            <MoreLink href="/talent" label="返回" title="返回" />

            <a href="#" title="立即報名" className="more_x more_x_gu">
              <span>立即報名</span>
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </a>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
