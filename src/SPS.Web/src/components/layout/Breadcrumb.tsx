import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * 積木元件：內頁共用的麵包屑，對應舊站 page/_uc/breadcrumb.html。
 *
 * 「首頁」永遠是第一項，呼叫端只要給後面的路徑就好，例如：
 *   <Breadcrumb items={[{ label: "公告事項", href: "/news" }, { label: "活動資訊" }]} />
 * 最後一項不用給 href，會自動當成當前頁（.active，不可點）；如果給了 href（例如列表頁自己的名稱「知識加值」「政府補助資源」），
 * 當前頁也會是可點的連結（`aria-current="page"`，點了就是重新載入這一頁），方便使用者從路徑回到這一頁的預設狀態（清掉篩選、搜尋）。
 */
export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const trail: BreadcrumbItem[] = [{ label: "首頁", href: "/" }, ...items];

  return (
    <ol className="breadcrumb p-0 m-0">
      {trail.map((item, index) => {
        const isCurrent = index === trail.length - 1;

        return (
          <li key={`${item.label}-${index}`} className={isCurrent ? "active" : undefined}>
            {item.href ? (
              <Link href={item.href} {...(isCurrent ? { "aria-current": "page" as const } : {})}>
                {item.label}
              </Link>
            ) : (
              item.label
            )}
          </li>
        );
      })}
    </ol>
  );
}
