import { COMPARE_ROWS, type CompareCell } from "@/lib/member-compare-data";

function Cell({ cell }: { cell: CompareCell }) {
  if (typeof cell === "string") return <td>{cell}</td>;
  return (
    <td>
      <i className={`bi bi-${cell.icon}-circle-fill`} aria-hidden="true"></i>
      {cell.text}
    </td>
  );
}

/**
 * 積木元件：會員權益比較表，對應舊站 p01.html（Step 2 內嵌）與
 * compare.html（獨立頁）共用的同一份 `.compare-table`。資料源見
 * [member-compare-data.ts](../../lib/member-compare-data.ts)。
 */
export default function CompareTable() {
  return (
    <div className="menb_compare_box">
      <table className="table compare-table" width="100%">
        <caption className="visually-hidden">各類型會員權益比較表</caption>
        <thead>
          <tr>
            <th scope="col">權益項目</th>
            <th scope="col">非會員</th>
            <th scope="col">個人會員</th>
            <th scope="col">企業會員-需求端</th>
            <th scope="col">
              企業會員-供給端
              <span className="d-block">(卓越會員)</span>
            </th>
            <th scope="col">
              企業會員-供給端
              <span className="d-block">(新興會員)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.cells.map((cell, index) => (
                <Cell key={index} cell={cell} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
