import { withBasePath } from "@/lib/api-client";
import type { TalentCourse } from "@/lib/talent-data";

/**
 * 積木元件：人才培訓右側欄「熱門課程」，對應設計稿
 * page/_uc/side2_course.html——版型跟通用的 `PopularPosts`（縮圖＋
 * 排名徽章）不一樣：左邊是縣市徽章＋日期＋標題，右邊是「剩餘 X 名」，
 * 沒有縮圖，資料形狀也不同，所以獨立元件，不硬套 `PopularPosts`。
 */
export default function PopularCourses({ courses }: { courses: TalentCourse[] }) {
  return (
    <div className="column_box column_course">
      <h4 className="mb-3">熱門課程</h4>

      {courses.map((course) => {
        const href = withBasePath(`/talent/${course.id}`);
        return (
          <div className="item" key={course.id}>
            <div className="d-flex">
              <div className="tit">
                <a href={href} title={course.title}>
                  <div className="tit_nsl">
                    <div className="tit_three d-flex mb-2">
                      <div className="tag-wrap">
                        <span className="badge-tag mb-0">{course.city}</span>
                      </div>
                      <div className="date">{course.postedDate}</div>
                    </div>
                    <h3>{course.title}</h3>
                  </div>
                </a>
              </div>

              <a href={href} className="pic" title={course.title}>
                <div className="tit_quota">
                  剩餘<span className="blue">{course.remainingSeats}名</span>
                </div>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
