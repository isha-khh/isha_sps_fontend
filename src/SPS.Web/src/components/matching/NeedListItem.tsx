import { withBasePath } from "@/lib/api-client";
import type { MatchingNeed } from "@/lib/matching-need-data";

/**
 * 積木元件：「媒合對接」列表頁單一需求項目，對應設計稿
 * `page/matching/index.html` 的 `.column_box .item`——跟企業名錄的
 * `EnterpriseCard` 版型完全不同（不是格狀圖卡，是整列文字項目），
 * 所以另外開一個元件，不勉強共用。
 *
 * 「訂閱解方」開的是同一頁所有項目共用的同一個 `#staticmembership`
 * 彈窗（設計稿原樣如此，彈窗內容跟點的是哪個需求無關，純粹是「同意
 * 免責聲明後送出訂閱」的靜態表單），所以這裡只需要 `data-bs-target`
 * 指過去，不用把彈窗掛在每個項目底下。
 */
export default function NeedListItem({ need }: { need: MatchingNeed }) {
  return (
    <div className="item">
      <div className="tit">
        <div className="tit_nsl">
          <div className="tit_three d-flex mb-2">
            <div className="tag-wrap">
              <span className="badge-tag mb-0">{need.statusLabel}</span>
            </div>
          </div>

          <div className="h3_solid">
            <h3>
              <a href={withBasePath(`/matching/${need.id}`)} title={need.title}>
                {need.title}
              </a>
            </h3>
          </div>

          <p>{need.description}</p>

          <div className="d-flex sup_xbox mb-md-4 mb-2">
            <ul className="nav d-block">
              <li className="mb-2">
                <i className="bi bi-geo-alt me-1" />
                <span>
                  <b>地點 : </b>
                  {need.location}
                </span>
              </li>
              <li className="mb-2">
                <i className="bi bi-calendar4-week me-1" />
                <span>
                  <b>發布日期 : </b>
                  {need.publishedDate}
                </span>
              </li>
              <li className="mb-2">
                <i className="bi bi-card-text me-1" />
                <span>
                  <b>需求編號 : </b>
                  {need.needCode}
                </span>
              </li>
              <li>
                <i className="bi bi-lock me-2" />
                <span className="red">
                  <b>企業會員可見完整內容 </b>
                </span>
              </li>
            </ul>

            <ul className="nav d-md-block d-flex sup_ul_s">
              <li className="mb-3">
                <a href={withBasePath(`/matching/${need.id}`)} title="提供解方" className="more_x">
                  <span>提供解方</span>
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="javascript:void(0)"
                  data-bs-toggle="modal"
                  data-bs-target="#staticmembership"
                  title="訂閱解方"
                  className="connec_s more_x more_x_gu"
                >
                  <span>訂閱解方</span>
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {need.keywords.length > 0 && (
          <ul className="nav ul-key">
            {need.keywords.map((keyword) => (
              <li key={keyword}>
                <a href="#" title={`前往${keyword}`} tabIndex={0}>
                  {keyword}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
