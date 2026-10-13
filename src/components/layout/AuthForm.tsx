"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "Email not confirmed": "이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.",
  "User already registered": "이미 가입된 이메일입니다.",
};

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const [error, setError] = useState(params.get("error") ? "인증 링크가 만료되었거나 올바르지 않습니다." : "");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(ERRORS[error.message] ?? error.message);
      router.push(next);
      router.refresh();
      return;
    }

    if (password !== form.get("passwordConfirm")) {
      setLoading(false);
      return setError("비밀번호가 일치하지 않습니다.");
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: String(form.get("name")) },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) return setError(ERRORS[error.message] ?? error.message);
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setNotice(`${email} 으로 인증 메일을 보냈습니다. 메일의 링크를 누르면 가입이 완료됩니다.`);
    }
  }

  if (notice) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold">메일을 확인해주세요</h1>
        <p className="mt-3 text-sm text-slate-600">{notice}</p>
        <Link href="/login" className="btn-primary btn mt-6">로그인으로</Link>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold">{mode === "login" ? "로그인" : "회원가입"}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="name">이름</label>
            <input id="name" name="name" required className="input" autoComplete="name" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="input"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="passwordConfirm">비밀번호 확인</label>
            <input id="passwordConfirm" name="passwordConfirm" type="password" required minLength={6} className="input" autoComplete="new-password" />
          </div>
        )}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary btn w-full py-3">
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            아직 회원이 아니신가요?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600">회원가입</Link>
          </>
        ) : (
          <>
            이미 계정이 있으신가요?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600">로그인</Link>
          </>
        )}
      </p>
    </div>
  );
}
