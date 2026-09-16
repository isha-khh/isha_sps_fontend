import { withBasePath } from "@/lib/api-client";
import type { TalentCourse } from "@/lib/talent-data";

/**
 * 積木元件：人才培訓列表用的課程表格，對應設計稿
 * page/talent/index.html 的 `.course-table`——跟其他列表頁的卡片
 * 版型不同，這裡客戶指定要用表格（序號/課程名稱/培訓單位/課程日期/
 * 縣市/聯絡人/課程網址），`data-label` 屬性搭配 CSS 是給手機版
 * RWD 直向卡片顯示用的（見 style.css `.course-table` 對應規則）。
 */
export default function CourseTable({ courses }: { courses: TalentCourse[] }) {
  return (
    <div className="course_box">
      <div className="course-table-container">
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
                  {index + 1}
                </td>
                <td data-label="課程名稱" className="td-name">
                  {course.title}
                </td>
                <td data-label="培訓單位" className="td-org">
                  {course.organizer}
                </td>
                <td data-label="課程日期" className="td-date">
                  {course.dateStart}
                  <br />~ {course.dateEnd}
                </td>
                <td data-label="縣市" className="td-city">
                  {course.city}
                </td>
                <td data-label="聯絡人" className="td-contact">
                  <div>{course.contactName}</div>
                  <a href={`tel:${course.contactPhone}`} title={`撥打電話給${course.contactName}：${course.contactPhone}`}>
                    {course.contactPhone}
                  </a>
                </td>
                <td data-label="課程網址" className="td-link">
                  <a
                    href={withBasePath(`/talent/${course.id}`)}
                    className="btn-course-link"
                    rel="noopener noreferrer"
                    title={`前往 ${course.title} 課程`}
                  >
                    前往課程
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
