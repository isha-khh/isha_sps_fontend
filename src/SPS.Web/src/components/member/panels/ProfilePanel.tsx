"use client";

import { useEffect, useState } from "react";
import { memberprofileApi } from "@/lib/api/memberprofile";
import type { MemberProfileResponse, UpdateMemberProfileRequest } from "@/types/memberprofile";
import { getApiErrorMessage } from "@/lib/error-utils";

interface ProfileForm {
  nickname: string;
  phone: string;
  extension: string;
  mobilePhone: string;
  position: string;
  memberJobTitle: string;
}

function toForm(profile: MemberProfileResponse): ProfileForm {
  return {
    nickname: profile.nickname ?? "",
    phone: profile.phone ?? "",
    extension: profile.extension ?? "",
    mobilePhone: profile.mobilePhone ?? "",
    position: profile.position ?? "",
    memberJobTitle: profile.memberJobTitle ?? "",
  };
}

/**
 * 積木元件：會員中心「基本資料」面板。
 *
 * 2026-09-10 對接真後端 `GET/PUT /api/member/profile`
 * （`memberprofileApi`）——這支 API client／型別（`lib/api/memberprofile.ts`
 * ／`types/memberprofile.ts`）本來就已經在這個專案裡，跟真後端
 * `MemberProfileController.cs` 的路由逐一對過，是能直接用的，不是
 * 這次新寫的。畫面本身（表單欄位/按鈕）是這次新做的，照現有站內
 * `.form-group`／`.form-control`／`btn-theme` 這套既有 class，不是
 * 照抄舊專案那份 Tailwind 版本的視覺。
 *
 * Email 唯讀（`disabled`）：跟登入帳號綁在一起，不是這個表單能改的
 * 欄位（後端 `UpdateMemberProfileRequest` 本來就沒有這個欄位）。
 */
export default function ProfilePanel() {
  const [profile, setProfile] = useState<MemberProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let mounted = true;
    memberprofileApi
      .getMembersProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setForm(toForm(data));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(getApiErrorMessage(err, "載入基本資料失敗"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setMessage(undefined);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const payload: UpdateMemberProfileRequest = {
        nickname: form.nickname,
        phone: form.phone,
        extension: form.extension,
        mobilePhone: form.mobilePhone,
        position: form.position,
        memberJobTitle: form.memberJobTitle,
      };
      const updated = await memberprofileApi.updateMembersProfile(payload);
      setProfile(updated);
      setForm(toForm(updated));
      setMessage("已更新基本資料");
    } catch (err) {
      setError(getApiErrorMessage(err, "更新失敗，請稍後再試"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted">載入中…</p>;
  }

  if (error && !profile) {
    return (
      <p className="text-danger">
        <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
        {error}
      </p>
    );
  }

  if (!form || !profile) return null;

  return (
    <div className="menb_inp_box d-flex">
      <div className="menb_inp_tit form-group">
        <label className="mb-2">會員帳號（Email）</label>
        <input type="text" className="form-control" value={profile.email} disabled />
      </div>

      <div className="menb_inp_tit form-group">
        <label className="mb-2">會員暱稱</label>
        <input type="text" className="form-control" value={form.nickname} onChange={(e) => updateField("nickname", e.target.value)} />
      </div>

      <div className="menb_inp_tit form-group">
        <label className="mb-2">職稱</label>
        <input type="text" className="form-control" value={form.position} onChange={(e) => updateField("position", e.target.value)} />
      </div>

      <div className="menb_inp_tit form-group">
        <label className="mb-2">職務抬頭</label>
        <input type="text" className="form-control" value={form.memberJobTitle} onChange={(e) => updateField("memberJobTitle", e.target.value)} />
      </div>

      <div className="menb_inp_tit form-group">
        <label className="mb-2">公司電話</label>
        <input type="text" className="form-control" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
      </div>

      <div className="menb_inp_tit form-group">
        <label className="mb-2">分機</label>
        <input type="text" className="form-control" value={form.extension} onChange={(e) => updateField("extension", e.target.value)} />
      </div>

      <div className="menb_inp_tit form-group">
        <label className="mb-2">手機</label>
        <input type="text" className="form-control" value={form.mobilePhone} onChange={(e) => updateField("mobilePhone", e.target.value)} />
      </div>

      {message && (
        <p className="text-success w-100 mb-0">
          <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
          {message}
        </p>
      )}
      {error && (
        <p className="text-danger w-100 mb-0">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <div className="w-100">
        <button type="button" className="tier-submit-btn" onClick={handleSave} disabled={saving}>
          <span>{saving ? "儲存中…" : "儲存變更"}</span>
        </button>
      </div>
    </div>
  );
}
