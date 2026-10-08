"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { demandRepliesApi, type MyDemandReply } from "@/lib/api/demand-replies";
import { getApiErrorMessage } from "@/lib/error-utils";

const STATUS_LABEL: Record<MyDemandReply["status"], { text: string; color: string }> = {
  Pending: { text: "審核中", color: "#6b3f00" },
  Approved: { text: "已通過，已寄出", color: "#1e7b34" },
  Rejected: { text: "未通過", color: "#c0392b" },
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("zh-TW");
}

/**
 * 積木元件：會員中心「我的回應」面板（供給端企業會員）——在媒合需求頁送出的回應與審核狀態。
 * 接 `GET /api/member/replies`。回應送出後是「審核中」，後台審核通過才會寄給刊登者與追蹤者；未通過會顯示退回原因（同時也寄信通知）。
 */
export default function RepliesPanel() {
  const [replies, setReplies] = useState<MyDemandReply[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    demandRepliesApi
      .getMine()
      .then((data) => active && setReplies(data))
      .catch((err) => active && setError(getApiErrorMessage(err, "載入我的回應失敗")));
    return () => {
      active = false;
    };
  }, []);

  if (!replies && !error) return <p className="text-muted">載入中…</p>;

  return (
    <div>
      {error && (
        <p className="text-danger" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}
      {replies && replies.length === 0 && (
        <p className="text-muted">
          還沒有送出的回應。到 <Link href="/matching">媒合對接</Link> 的需求頁面按「我要回應」，審核通過後會寄給刊登者與追蹤者。
        </p>
      )}
      {replies && replies.length > 0 && (
        <div className="d-grid gap-2">
          {replies.map((reply) => {
            const status = STATUS_LABEL[reply.status];
            return (
              <div key={reply.id} className="border rounded p-3">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <Link href={`/matching/${reply.demandId}`} className="blue">
                      <strong>{reply.demandName}</strong>
                    </Link>
                    <div className="small text-muted">
                      編號 {reply.demandNumber}　送出日期 {formatDate(reply.createdTime)}
                    </div>
                  </div>
                  <span style={{ color: status.color, fontWeight: 700 }}>{status.text}</span>
                </div>
                <p className="mt-2 mb-0" style={{ whiteSpace: "pre-wrap" }}>
                  {reply.content}
                </p>
                {reply.status === "Rejected" && reply.rejectReason && (
                  <p className="mt-2 mb-0 small" style={{ color: "#c0392b" }}>
                    退回原因：{reply.rejectReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
