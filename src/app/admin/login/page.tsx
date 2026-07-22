"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setPending(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "로그인에 실패했습니다.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <p className="admin-kicker">ONLINE OFFICE</p>
        <h1>관리자 통계</h1>
        <p>비밀번호를 입력해 통계와 내보내기 기능을 이용하세요.</p>
        <label htmlFor="admin-password">비밀번호</label>
        <input
          id="admin-password"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={pending}>{pending ? "확인 중…" : "들어가기"}</button>
      </form>
    </main>
  );
}
