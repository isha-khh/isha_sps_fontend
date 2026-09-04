import Link from "next/link";
import PasswordField from "@/components/member/PasswordField";
import ChecklistGroup from "@/components/member/ChecklistGroup";
import SmartTechSelector from "@/components/member/SmartTechSelector";
import DocumentUploadField from "@/components/member/DocumentUploadField";
import { APPLICATION_SCENARIOS, APPLICATION_SCOPES } from "@/lib/member-registration-data";

const REQUIRED = (
  <span className="red me-1" aria-hidden="true">
    *
  </span>
);

/**
 * 積木元件：會員註冊 Step 3「填寫資料」／Step 4「完成註冊」共用的大型
 * 表單，對應舊站 p02.html（可填寫）／p03.html（唯讀檢視+確認送出）。
 *
 * 這兩頁在舊站原始碼裡是幾乎一模一樣的欄位（label、id、demo 假資料的
 * checkbox 勾選狀態都相同），差別只在：p02 每個欄位可編輯、多一個
 * 「確認密碼」欄位、上傳文件是真的上傳按鈕；p03 所有欄位 `disabled`
 * 並帶入示範假資料、上傳文件變成靜態縮圖、底部按鈕從「下一步」換成
 * 「確認送出」（觸發完成註冊 modal）。拆成一個共用元件＋`mode` 開關，
 * 不是各自複製一份 1000+ 行的 JSX。
 *
 * `mode="review"` 的示範假資料（email@gmail.com、王小名…）直接照抄
 * p03.html 寫死的內容，不是我們自己編的——這是舊站本身用來展示「填完
 * 資料長怎樣」的 demo 資料。
 */
export default function MemberDetailsForm({ mode, onSubmitHref, onSubmitLabel }: { mode: "edit" | "review"; onSubmitHref: string; onSubmitLabel: string }) {
  const disabled = mode === "review";
  const requiredMark = mode === "edit" ? REQUIRED : null;

  return (
    <>
      <h3 className="mb-4 me_sho">
        帳號註冊{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
      </h3>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group">
          <label className="mb-2">
            {requiredMark}電子郵件(登入帳號)
          </label>
          <input type="text" className="form-control" placeholder="請輸入電子郵件" defaultValue={disabled ? "email@gmail.com" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}會員密碼</label>
          <PasswordField disabled={disabled} defaultValue={disabled ? "123456" : undefined} />
        </div>

        {mode === "edit" && (
          <div className="menb_inp_tit form-group">
            <label className="mb-2">{REQUIRED}確認密碼</label>
            <PasswordField label="確認密碼" placeholder="請輸入確認密碼" />
          </div>
        )}
      </div>

      <h3 className="mb-4 me_sho mt-4">
        個人資料{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
      </h3>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}姓名</label>
          <input type="text" className="form-control" placeholder="請輸入姓名" defaultValue={disabled ? "王小名" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}聯絡電話</label>
          <input type="text" className="form-control" placeholder="請輸入聯絡電話" defaultValue={disabled ? "04XXXXXXXX" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">手機</label>
          <input type="text" className="form-control" placeholder="請輸入手機" defaultValue={disabled ? "09XXXXXXXX" : undefined} disabled={disabled} />
        </div>
      </div>

      <h3 className="mb-4 me_sho mt-4">
        公司資料{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
      </h3>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}所屬公司名稱</label>
          <input type="text" className="form-control" placeholder="請輸入所屬公司名稱" defaultValue={disabled ? "智慧工安" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}產業別</label>
          <select className="form-select" aria-label="請選擇" disabled={disabled} defaultValue={disabled ? "工業" : "請選擇"}>
            {disabled && <option>工業</option>}
            {!disabled && <option>請選擇</option>}
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}職稱</label>
          <input type="text" className="form-control" placeholder="請輸入職稱" defaultValue={disabled ? "業務" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">{requiredMark}LOGO圖像</label>
          {disabled ? (
            <div className="menb_logo">
              <img className="img-fluid d-block" src="/images/all/menb_logo.jpg" alt="" style={{ width: 200, height: 200 }} />
            </div>
          ) : (
            <DocumentUploadField label="LOGO" mode="edit" hint="上傳格式支援影像檔，最大上限10MB。" />
          )}
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}公司負責人姓名</label>
          <input type="text" className="form-control" placeholder="請輸入公司負責人姓名" defaultValue={disabled ? "王小名" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}成立日期</label>
          <input
            type="text"
            placeholder="開始日期"
            id="startDate"
            className="form-control areadrp sideByside"
            defaultValue={disabled ? "2026.8.26" : undefined}
            disabled={disabled}
          />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}統一編號</label>
          <input type="text" className="form-control" placeholder="請輸入統一編號" defaultValue={disabled ? "123456" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}公司電話</label>
          <input type="text" className="form-control" placeholder="公司電話" defaultValue={disabled ? "04XXXXXXXX" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}資本總額</label>
          <input type="text" className="form-control" placeholder="資本總額" defaultValue={disabled ? "2千萬" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">{requiredMark}公司地址</label>
          <div className="col-12 col-sm">
            <div className="row g-2">
              <div className="col-6 mb-md-0 mb-2">
                <select className="form-select" aria-label="縣市" disabled={disabled} defaultValue={disabled ? "台中市" : "縣/市"}>
                  {disabled ? <option>台中市</option> : <option>縣/市</option>}
                  <option value="1">基隆市</option>
                  <option value="2">台北市</option>
                </select>
              </div>
              <div className="col-6 mb-md-0 mb-2">
                <select className="form-select" aria-label="鄉鎮市區" disabled={disabled} defaultValue={disabled ? "北區" : "鄉/鎮/區"}>
                  {disabled ? <option>北區</option> : <option>鄉/鎮/區</option>}
                  <option value="1">中正區</option>
                  <option value="2">信義區</option>
                </select>
              </div>
              <div className="col-12">
                <input
                  type="text"
                  className="form-control"
                  placeholder="地址"
                  defaultValue={disabled ? "高雄市左營區博愛三路12號15樓" : undefined}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">{requiredMark}公司網址</label>
          <input type="text" className="form-control" placeholder="公司網址" defaultValue={disabled ? "www.eztrust.com" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">{requiredMark}公司簡介</label>
          <textarea
            className="form-control"
            rows={5}
            disabled={disabled}
            defaultValue={
              disabled
                ? "說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明"
                : undefined
            }
          />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">{requiredMark}主要產品暨服務</label>
          <select className="form-select" aria-label="請選擇" disabled={disabled} defaultValue={disabled ? "產品" : "請選擇"}>
            {disabled ? <option>產品</option> : <option>請選擇</option>}
          </select>
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">{REQUIRED}應用情境(可多選)</label>
          <ChecklistGroup idPrefix="fxContext" options={APPLICATION_SCENARIOS} disabled={disabled} threeColumn />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">{REQUIRED}應用範疇(可多選)</label>
          <ChecklistGroup idPrefix="fxScope" options={APPLICATION_SCOPES} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">{REQUIRED}智慧技術(可多選)</label>
          <SmartTechSelector disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">獲獎事蹟暨重要合作案例</label>
          <input
            type="text"
            className="form-control"
            placeholder="請輸入獲獎事蹟暨重要合作案例"
            defaultValue={disabled ? "說明說明說明說明說明" : undefined}
            disabled={disabled}
          />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">工廠名稱</label>
          <input type="text" className="form-control" placeholder="請輸入工廠名稱" defaultValue={disabled ? "智慧工安工廠" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">工廠地址</label>
          <div className="col-12 col-sm">
            <div className="row g-2">
              <div className="col-6 mb-md-0 mb-2">
                <select className="form-select" aria-label="縣市" disabled={disabled} defaultValue={disabled ? "台中市" : "縣/市"}>
                  {disabled ? <option>台中市</option> : <option>縣/市</option>}
                  <option value="1">基隆市</option>
                  <option value="2">台北市</option>
                </select>
              </div>
              <div className="col-6 mb-md-0 mb-2">
                <select className="form-select" aria-label="鄉鎮市區" disabled={disabled} defaultValue={disabled ? "北區" : "鄉/鎮/區"}>
                  {disabled ? <option>北區</option> : <option>鄉/鎮/區</option>}
                  <option value="1">中正區</option>
                  <option value="2">信義區</option>
                </select>
              </div>
              <div className="col-12">
                <input
                  type="text"
                  className="form-control"
                  placeholder="地址"
                  defaultValue={disabled ? "高雄市左營區博愛三路12號15樓" : undefined}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="mb-4 me_sho mt-md-5 mt-4">
        上傳文件{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
      </h3>
      <div className="menb_inp_tit form-group w-100">
        <div className="d-flex dow-document">
          <DocumentUploadField label="公司登記證明文件" required mode={mode} />
          <DocumentUploadField label="工廠登記證明文件" required mode={mode} />
          <DocumentUploadField label="技術服務能量/相關登錄證明" required mode={mode} />
          <DocumentUploadField label="智慧工安技術產業資訊暨媒合平台登錄申請書" required mode={mode} />
        </div>
      </div>

      <h3 className="mb-4 me_sho mt-md-5 mt-4">其他佐證文件</h3>
      <div className="menb_inp_tit form-group w-100">
        <div className="d-flex dow-document">
          <DocumentUploadField label="如營業登記證明、證書等" mode={mode} />
        </div>
      </div>

      <div className="review_box">
        <label>審查方式</label>
        <div className="review_box_r">
          <span>文件審查＋至少5位專家審查</span>
        </div>
      </div>

      {mode === "edit" && (
        <div className="checkbox d-flex mb-3">
          <label className="relative">
            <input type="checkbox" aria-label="同意已充分知悉告知事項" title="本人已充分知悉貴署上述告知事項" className="form-check-input peer me-1" />
          </label>
          <span>
            我已詳細閱讀「
            <a href="#" data-bs-toggle="modal" data-bs-target="#staticmembership" className="blue text-decoration-underline" title="我已詳細閱讀個人資料同意書">
              個人資料同意書
            </a>
            」
          </span>
        </div>
      )}

      <div className="card-footer d-flex justify-content-between">
        <Link className="btn-outline-dark" href={mode === "edit" ? "/member/register/account" : "/member/register/info"} title="上一步">
          <i className="bi bi-chevron-left" aria-hidden="true"></i>上一步
        </Link>
        {mode === "edit" ? (
          <Link className="btn-theme" href={onSubmitHref} title={onSubmitLabel}>
            {onSubmitLabel}
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
          </Link>
        ) : (
          <a className="btn-theme" href="#" data-bs-toggle="modal" data-bs-target="#staticmembership" title={onSubmitLabel}>
            {onSubmitLabel}
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
          </a>
        )}
      </div>
    </>
  );
}
