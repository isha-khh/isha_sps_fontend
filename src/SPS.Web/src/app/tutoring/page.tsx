import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import TutoringItemCard from "@/components/tutoring/TutoringItemCard";
import { TUTORING_ITEMS } from "@/lib/tutoring-data";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "產業輔導",
};

/**
 * 產業輔導列表，對應設計稿 page/tutoring/index.html。目前後端沒有
 * 對應的內容類型，先用 tutoring-data.ts 的假資料，分頁跟 /serve
 * 一樣先用寫死的佔位（currentPage/totalPages），之後接真後端時再
 * 照實際筆數切頁。
 */
export default function TutoringIndexPage() {
  return (
    <>
      <BodyClass className="tutoring" />
      <InnerPageShell
        title="輔導"
        breadcrumb={[{ label: "產業輔導" }, { label: "輔導" }]}
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
        <div className="search mb-md-5 mb-4">
          <SearchBar keywordPlaceholder="請輸入關鍵字" />
        </div>

        <div className="column_box">
          {TUTORING_ITEMS.map((item) => (
            <TutoringItemCard item={item} key={item.id} />
          ))}
        </div>

        <Pagination currentPage={1} totalPages={5} getHref={(page) => `/tutoring?page=${page}`} />
      </InnerPageShell>
    </>
  );
}
