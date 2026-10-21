import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import ShareBox from "@/components/ui/ShareBox";
import MoreLink from "@/components/ui/MoreLink";
import PopularCourses from "@/components/talent/PopularCourses";
import SidebarBanner from "@/components/layout/SidebarBanner";
import NewsViewTracker from "@/components/news/NewsViewTracker";
import { PuckRenderer } from "@/components/puck/PuckRenderer";
import { toTalentCourse, type TalentCourse } from "@/lib/talent-data";
import { fetchBanners, fetchSectionDetail, fetchSectionItems, NewsSections } from "@/lib/api.server";
import { sortByViewCount } from "@/lib/content-list-utils";

export async function generateMetadata({ params }: PageProps<"/talent/[id]">): Promise<Metadata> {
  const { id } = await params;
  const course = await fetchSectionDetail(NewsSections.Talent, id);
  return { title: course?.title ?? "找不到頁面" };
}

/** 課程資訊表格的列；後台沒填的欄位整列不顯示 */
const INFO_ROWS = (course: TalentCourse) =>
  [
    { icon: "bi-tag", term: "課程代號", desc: course.courseCode },
    { icon: "bi-calendar-event", term: "課程日期", desc: course.courseDate },
    { icon: "bi-clock", term: "課程時間", desc: course.courseTime },
    { icon: "bi-hourglass-split", term: "總時數", desc: course.totalHours },
    { icon: "bi-currency-dollar", term: "課程費用", desc: course.fee, danger: true },
    { icon: "bi-person", term: "適合對象", desc: course.audience },
    { icon: "bi-geo-alt", term: "上課地點", desc: course.location },
    { icon: "bi-building", term: "主辦單位", desc: course.hostOrganizer },
    { icon: "bi-building", term: "執行單位", desc: course.executor },
  ].filter((row) => row.desc);

/**
 * 人才培訓課程詳情頁，對應設計稿 page/talent/show.html。2026-10-13 起資料來自後台「人才培育 → 課程內容」，
 * `course-info-card` 是這頁特有的課程資訊表格（欄位存在 `News.Meta`）；內文、附件下載、相關連結、聯絡資訊
 * 都是後台內容編輯器裡的區塊。「立即報名」連去後台填的報名網址，沒填就不顯示按鈕。
 */
export default async function TalentShowPage({ params }: PageProps<"/talent/[id]">) {
  const { id } = await params;
  const [detail, sidebarBanners, popularSource] = await Promise.all([
    fetchSectionDetail(NewsSections.Talent, id),
    fetchBanners("sidebar-talent"),
    fetchSectionItems(NewsSections.Talent, { pageSize: 20 }),
  ]);

  if (!detail) {
    notFound();
  }

  const course = toTalentCourse(detail);
  const rows = INFO_ROWS(course);
  const popularCourses = sortByViewCount(popularSource.items).slice(0, 5).map(toTalentCourse);

  return (
    <>
      {/* 設計稿詳情頁的 body 是 `news talent show`：`.news.show .breadcrumb { margin-top:110px }` 把麵包屑推到固定導覽列下面，少了 `news` 標題會壓到導覽列（issue #39） */}
      <BodyClass className="news talent show" />
      <NewsViewTracker newsId={detail.id} />
      <InnerPageShell
        breadcrumb={[{ label: "服務專區", href: "/serve" }, { label: "人才培育", href: "/talent" }, { label: "知識加值", href: "/talent" }, { label: course.title }]}
        aside={
          <>
            {popularCourses.length > 0 && <PopularCourses courses={popularCourses} />}
            <SidebarBanner banners={sidebarBanners} />
          </>
        }
      >
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <h3>{course.title}</h3>

              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="tag-wrap">{course.city && <span className="badge-tag mb-0">{course.city}</span>}</div>
                  <div className="part-line"></div>
                  {/* 課程公告上架日期；其他詳情頁（公告、產業輔導）標題下都有日期，這裡原本漏了（issue #63） */}
                  {course.postedDate && <div className="date">{course.postedDate}</div>}
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

          {rows.length > 0 && (
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

                {course.registerUrl && (
                  <a href={course.registerUrl} title="立即報名（另開視窗）" target="_blank" rel="noopener noreferrer" className="more_x more_x_gu mt-4">
                    <span>立即報名</span>
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="txt editor mb-md-5 mb-4">
            <PuckRenderer content={detail.content} />
          </div>

          <div className="d-flex sign_ta">
            <MoreLink href="/talent" label="返回" title="返回" />

            {course.registerUrl && (
              <a href={course.registerUrl} title="立即報名（另開視窗）" target="_blank" rel="noopener noreferrer" className="more_x more_x_gu">
                <span>立即報名</span>
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
