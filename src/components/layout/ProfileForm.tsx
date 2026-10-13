"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({ userId, name, phone }: { userId: string; name: string; phone: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const form = new FormData(e.currentTarget);
        await createClient()
          .from("profiles")
          .update({ name: String(form.get("name")), phone: String(form.get("phone")) })
          .eq("id", userId);
        setSaving(false);
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 1500);
      }}
    >
      <div>
        <label className="label" htmlFor="p-name">이름</label>
        <input id="p-name" name="name" defaultValue={name} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="p-phone">연락처</label>
        <input id="p-phone" name="phone" defaultValue={phone} placeholder="010-0000-0000" className="input" />
      </div>
      <button disabled={saving} className="btn-dark btn">{saved ? "저장됨 ✓" : "저장"}</button>
    </form>
  );
}
