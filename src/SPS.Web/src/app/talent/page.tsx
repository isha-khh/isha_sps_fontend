import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import CourseTable from "@/components/talent/CourseTable";
import PopularPosts from "@/components/layout/PopularPosts";
import { TALENT_COURSES } from "@/lib/talent-data";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "人才培訓",
};

/**
 * 人才培訓課程列表，對應設計稿 page/talent/index.html。目前後端
 * 沒有對應的內容類型，先用 talent-data.ts 的假資料，分頁跟
 * /serve、/tutoring 一樣先用寫死的佔位。
 */
export default function TalentIndexPage() {
  const popularCourses = TALENT_COURSES.map((course) => ({
    href: `/talent/${course.id}`,
    title: course.title,
    date: course.dateRange,
    image: withBasePath("/images/all/new_logo.jpg"),
  }));

  return (
    <>
      <BodyClass className="talent" />
      <InnerPageShell
        title="人才培訓"
        breadcrumb={[{ label: "人才培育" }, { label: "人才培訓" }]}
        aside={<PopularPosts items={popularCourses} heading="熱門課程" />}
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
        <div className="search mb-4">
          <SearchBar keywordPlaceholder="請輸入關鍵字" />
        </div>

        <CourseTable courses={TALENT_COURSES} />

        <Pagination currentPage={1} totalPages={5} getHref={(page) => `/talent?page=${page}`} />
      </InnerPageShell>
    </>
  );
}
