import type { MatchingNeed } from "@/lib/matching-need-data";

/**
 * 媒合需求的狀態標籤：「徵求中」（預設樣式）或「已成功對接」（綠色）。
 * 前台公開的只有這個狀態，對接到哪家企業不公開（issue #98）。
 */
export default function NeedStatusBadge({ need, className = "badge-tag" }: { need: Pick<MatchingNeed, "statusLabel" | "matched">; className?: string }) {
  return (
    <span className={className} style={need.matched ? { background: "#198754", color: "#fff", borderColor: "#198754" } : undefined}>
      {need.statusLabel}
    </span>
  );
}
