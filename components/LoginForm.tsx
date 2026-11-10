"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function Eye({ off }: { off: boolean }) {
  return off ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const body = JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)));
    const r = await fetch("/api/login", { method: "POST", body, headers: { "Content-Type": "application/json" } });
    setBusy(false);
    if (r.ok) { router.push("/admin"); router.refresh(); } else setErr((await r.json()).error ?? "Login gagal.");
  }
  return (
    <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8">
      <h1 className="text-2xl font-extrabold">Masuk admin</h1>
      <input name="username" required autoComplete="username" placeholder="Username" className="field" />
      <div className="relative">
        <input
          name="password"
          type={show ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="Kata sandi"
          className="field pr-12"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted transition hover:text-ink"
        >
          <Eye off={show} />
        </button>
      </div>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <button disabled={busy} className="btn btn-primary w-full">{busy ? "Memproses…" : "Masuk"}</button>
    </form>
  );
}