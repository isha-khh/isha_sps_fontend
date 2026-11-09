import type { TalentCourse } from "@/lib/talent-data";
import Link from "next/link";
import ScrollHintContainer from "@/components/ui/ScrollHintContainer";

/**
 * 積木元件：人才培訓列表用的課程表格，對應設計稿
 * page/talent/index.html 的 `.course-table`——跟其他列表頁的卡片
 * 版型不同，這裡客戶指定要用表格（序號/課程名稱/培訓單位/課程日期/
 * 縣市/聯絡人/課程網址）。1199px 以下由設計稿的 style_rwd.css 讓表格容器
 * 橫向捲動（表格 min-width 800px），手機也一樣用捲動，不另外做卡片版；
 * 表格比畫面寬時，`ScrollHintContainer` 會在上方顯示「左右滑動查看更多欄位」提示並加上邊緣陰影。
 */
export default function CourseTable({ courses, startIndex = 0 }: { courses: TalentCourse[]; startIndex?: number }) {
  return (
    <div className="course_box">
      <ScrollHintContainer className="course-table-container" label="培訓課程表格，可左右捲動查看更多欄位">
        <table className="course-table">
          <caption className="visually-hidden">培訓課程清單，包含序號、課程名稱、培訓單位、課程日期、縣市、聯絡人與課程網址</caption>
          <thead>
            <tr>
              <th scope="col" className="th-seq">
                序號
              </th>
              <th scope="col" className="th-name">
                課程名稱
              </th>
              <th scope="col" className="th-org">
                培訓單位
              </th>
              <th scope="col" className="th-date">
                課程日期
              </th>
              <th scope="col" className="th-city">
                縣市
              </th>
              <th scope="col" className="th-contact">
                聯絡人
              </th>
              <th scope="col" className="th-link">
                課程網址
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => (
              <tr key={course.id}>
                <td data-label="序號" className="td-seq">
                  {startIndex + index + 1}
                </td>
                <td data-label="課程名稱" className="td-name">
                  {course.title}
                </td>
                <td data-label="培訓單位" className="td-org">
                  {course.organizer}
                </td>
                <td data-label="課程日期" className="td-date">
                  {course.dateStart}
                  {course.dateEnd && (
                    <>
                      <br />~ {course.dateEnd}
                    </>
                  )}
                </td>
                <td data-label="縣市" className="td-city">
                  {course.city}
                </td>
                <td data-label="聯絡人" className="td-contact">
                  <div>{course.contactName}</div>
                  {course.contactPhone && (
                    <a href={`tel:${course.contactPhone}`} title={`撥打電話給${course.contactName}：${course.contactPhone}`}>
                      {course.contactPhone}
                    </a>
                  )}
                </td>
                <td data-label="課程網址" className="td-link">
                  <Link
                    href={`/talent/${course.id}`}
                    className="btn-course-link"
                    rel="noopener noreferrer"
                    title={`前往 ${course.title} 課程`}
                  >
                    前往課程
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollHintContainer>
    </div>
  );
}
