"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import PasswordField from "@/components/member/PasswordField";
import { memberprofileApi } from "@/lib/api/memberprofile";
import type { CreateCompanyMemberRequest, MemberListItemResponse } from "@/types/memberprofile";
import { getApiErrorMessage } from "@/lib/error-utils";

/** 後端 `Status`：成員帳號只能在啟用與停用之間切換（鎖定、待審核由後台管理） */
const STATUS_ACTIVE = 1;
const STATUS_INACTIVE = 0;
/** 後端 `MemberPosition` */
const POSITION_MANAGER = 1;
const POSITION_EMPLOYEE = 2;

interface MemberForm {
  email: string;
  nickname: string;
  phone: string;
  extension: string;
  mobilePhone: string;
  position: string;
  memberJobTitle: string;
  memberPosition: number;
  password: string;
  isDesignatedContact: boolean;
}

const EMPTY_FORM: MemberForm = {
  email: "",
  nickname: "",
  phone: "",
  extension: "",
  mobilePhone: "",
  position: "",
  memberJobTitle: "",
  memberPosition: POSITION_EMPLOYEE,
  password: "",
  isDesignatedContact: false,
};

/**
 * 積木元件：會員中心「成員管理」面板（企業會員專屬）。接 `/api/member/company/members` 一組端點：
 * 公司經理（有「編輯公司資料」權限）可以新增、修改、停用／啟用、刪除同公司的成員、重設成員密碼、指定聯絡窗口；
 * 沒有權限的成員（員工）後端回 403，這裡顯示說明而不是錯誤。**指定聯絡窗口的人，就是企業名錄「取得聯繫窗口」
 * 給出去的聯絡人與電話**，所以這裡改的資料會直接對外。
 *
 * 後端會擋：只能管同公司、不能刪除或停用自己、狀態只能啟用／停用、新密碼至少 8 個字元。
 */
export default function MembersPanel() {
  const myId = useAuthStore((state) => state.member?.id);
  const [members, setMembers] = useState<MemberListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  // editing: null = 沒有展開；"new" = 新增；其他是成員 id
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const load = useCallback(async () => {
    try {
      setMembers(await memberprofileApi.getMembersList());
      setForbidden(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 403) setForbidden(true);
      else setError(getApiErrorMessage(err, "載入成員失敗"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    memberprofileApi
      .getMembersList()
      .then((data) => {
        if (!active) return;
        setMembers(data);
        setForbidden(false);
      })
      .catch((err) => {
        if (!active) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 403) setForbidden(true);
        else setError(getApiErrorMessage(err, "載入成員失敗"));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function openNew() {
    setEditing("new");
    setForm(EMPTY_FORM);
    setResetting(null);
    setError(undefined);
    setMessage(undefined);
  }

  function openEdit(member: MemberListItemResponse) {
    setEditing(member.id);
    setForm({
      email: member.email,
      nickname: member.name === member.email ? "" : member.name,
      phone: member.phone ?? "",
      extension: member.extension ?? "",
      mobilePhone: member.mobilePhone ?? "",
      position: member.position ?? "",
      memberJobTitle: member.memberJobTitle ?? "",
      memberPosition: member.memberPosition,
      password: "",
      isDesignatedContact: member.isDesignatedContact,
    });
    setResetting(null);
    setError(undefined);
    setMessage(undefined);
  }

  async function run(action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await action();
      setMessage(success);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "操作失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (editing === "new") {
      if (!form.email.trim()) return setError("請輸入 Email");
      if (form.password.length < 8) return setError("密碼至少 8 個字元");
      await run(async () => {
        await memberprofileApi.createMember({ ...form, email: form.email.trim(), memberPosition: form.memberPosition as CreateCompanyMemberRequest["memberPosition"] });
        setEditing(null);
      }, "已新增成員，請把帳號與初始密碼告知對方。");
    } else if (editing) {
      const target = members.find((m) => m.id === editing);
      if (!target) return;
      await run(async () => {
        await memberprofileApi.updateMember(editing, {
          nickname: form.nickname,
          phone: form.phone,
          extension: form.extension,
          mobilePhone: form.mobilePhone,
          position: form.position,
          memberJobTitle: form.memberJobTitle,
          status: target.status,
          isDesignatedContact: form.isDesignatedContact,
        });
        setEditing(null);
      }, "已更新成員資料");
    }
  }

  const field = (key: keyof MemberForm, label: string, opts?: { disabled?: boolean; maxLength?: number }) => (
    <div className="menb_inp_tit form-group">
      <label className="mb-2">{label}</label>
      <input
        type="text"
        className="form-control"
        value={String(form[key])}
        disabled={opts?.disabled}
        maxLength={opts?.maxLength ?? 100}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    </div>
  );

  if (loading) return <p className="text-muted">載入中…</p>;

  if (forbidden) {
    return (
      <p className="text-muted">
        <i className="bi bi-info-circle-fill me-1" aria-hidden="true"></i>
        只有公司經理可以管理成員。需要新增或停用成員，請洽貴公司的經理。
      </p>
    );
  }

  return (
    <div>
      <p className="small text-muted">
        被設為「指定聯絡窗口」的成員，姓名與電話會提供給在企業名錄查詢貴公司聯繫窗口的企業會員，請確認資料正確。
      </p>

      <div className="mb-3">
        <button type="button" className="tier-submit-btn" onClick={openNew} disabled={busy}>
          <span>新增成員</span>
        </button>
      </div>

      {message && (
        <p className="text-success">
          <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
          {message}
        </p>
      )}
      {error && (
        <p className="text-danger" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      {editing && (
        <div className="menb_inp_box d-flex mb-4 p-3 border rounded">
          <h4 className="w-100 h5">{editing === "new" ? "新增成員" : "修改成員資料"}</h4>
          {field("email", "Email（登入帳號）", { disabled: editing !== "new", maxLength: 320 })}
          {field("nickname", "暱稱")}
          {field("position", "職稱")}
          {field("memberJobTitle", "職務抬頭")}
          {field("phone", "公司電話", { maxLength: 50 })}
          {field("extension", "分機", { maxLength: 20 })}
          {field("mobilePhone", "手機", { maxLength: 50 })}
          {editing === "new" && (
            <>
              <div className="menb_inp_tit form-group">
                <label className="mb-2">成員身分</label>
                <select className="form-select" value={form.memberPosition} onChange={(e) => setForm((prev) => ({ ...prev, memberPosition: Number(e.target.value) }))}>
                  <option value={POSITION_EMPLOYEE}>員工</option>
                  <option value={POSITION_MANAGER}>經理</option>
                </select>
              </div>
              <div className="menb_inp_tit form-group">
                <label className="mb-2">初始密碼（至少 8 個字元）</label>
                <PasswordField label="初始密碼" placeholder="請輸入初始密碼" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} />
              </div>
            </>
          )}
          <div className="form-check w-100 ms-2 mb-3">
            <input
              id="member-designated"
              className="form-check-input"
              type="checkbox"
              checked={form.isDesignatedContact}
              onChange={(e) => setForm((prev) => ({ ...prev, isDesignatedContact: e.target.checked }))}
            />
            <label className="form-check-label" htmlFor="member-designated">
              設為指定聯絡窗口
            </label>
          </div>
          <div className="w-100 d-flex gap-2">
            <button type="button" className="tier-submit-btn" onClick={() => void save()} disabled={busy}>
              <span>{busy ? "儲存中…" : "儲存"}</span>
            </button>
            <button type="button" className="tier-reset-btn" onClick={() => setEditing(null)} disabled={busy}>
              取消
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <p className="text-muted">目前沒有成員。</p>
      ) : (
        <div className="d-grid gap-3">
          {members.map((member) => {
            const isMe = member.id === myId;
            const active = member.status === STATUS_ACTIVE;
            return (
              <div key={member.id} className="border rounded p-3">
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <div>
                    <strong>{member.name}</strong>
                    {isMe && <span className="badge bg-secondary ms-2">本人</span>}
                    {member.memberPosition === POSITION_MANAGER && <span className="badge bg-primary ms-2">經理</span>}
                    {member.isDesignatedContact && <span className="badge bg-success ms-2">指定聯絡窗口</span>}
                    {!active && <span className="badge bg-warning text-dark ms-2">已停用</span>}
                    <div className="small text-muted">{member.email}</div>
                    <div className="small text-muted">
                      {[member.position, member.memberJobTitle].filter(Boolean).join("／") || "—"}
                      {member.phone ? `　${member.phone}${member.extension ? `#${member.extension}` : ""}` : ""}
                      {member.mobilePhone ? `　${member.mobilePhone}` : ""}
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 align-items-start">
                    <button type="button" className="tier-reset-btn" onClick={() => openEdit(member)} disabled={busy}>
                      編輯
                    </button>
                    <button
                      type="button"
                      className="tier-reset-btn"
                      disabled={busy}
                      onClick={() => run(() => memberprofileApi.updateDesignatedContact(member.id, !member.isDesignatedContact), member.isDesignatedContact ? "已取消指定聯絡窗口" : "已設為指定聯絡窗口")}
                    >
                      {member.isDesignatedContact ? "取消聯絡窗口" : "設為聯絡窗口"}
                    </button>
                    {!isMe && (
                      <>
                        <button
                          type="button"
                          className="tier-reset-btn"
                          disabled={busy}
                          onClick={() => {
                            setResetting(resetting === member.id ? null : member.id);
                            setResetPassword("");
                            setEditing(null);
                          }}
                        >
                          重設密碼
                        </button>
                        <button
                          type="button"
                          className="tier-reset-btn"
                          disabled={busy}
                          onClick={() =>
                            run(
                              () =>
                                memberprofileApi
                                  .updateMember(member.id, {
                                    nickname: member.name === member.email ? "" : member.name,
                                    phone: member.phone ?? "",
                                    extension: member.extension ?? "",
                                    mobilePhone: member.mobilePhone ?? "",
                                    position: member.position ?? "",
                                    memberJobTitle: member.memberJobTitle ?? "",
                                    status: active ? STATUS_INACTIVE : STATUS_ACTIVE,
                                    isDesignatedContact: member.isDesignatedContact,
                                  })
                                  .then(() => undefined),
                              active ? "已停用成員，對方將無法登入" : "已啟用成員",
                            )
                          }
                        >
                          {active ? "停用" : "啟用"}
                        </button>
                        <button
                          type="button"
                          className="tier-reset-btn text-danger"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`確定要刪除成員「${member.name}」嗎？刪除後無法復原。`)) void run(() => memberprofileApi.deleteMember(member.id), "已刪除成員");
                          }}
                        >
                          刪除
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {resetting === member.id && (
                  <div className="mt-3 d-flex flex-wrap gap-2 align-items-end">
                    <div style={{ minWidth: 260 }}>
                      <label className="mb-2 small">新密碼（至少 8 個字元，對方下次登入需改密碼）</label>
                      <PasswordField label="新密碼" placeholder="請輸入新密碼" value={resetPassword} onChange={setResetPassword} />
                    </div>
                    <button
                      type="button"
                      className="tier-submit-btn"
                      disabled={busy || resetPassword.length < 8}
                      onClick={() =>
                        run(async () => {
                          await memberprofileApi.resetPasswordById(member.id, { newPassword: resetPassword, requirePasswordChange: true });
                          setResetting(null);
                          setResetPassword("");
                        }, "已重設密碼，請把新密碼告知對方。")
                      }
                    >
                      <span>確認重設</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
