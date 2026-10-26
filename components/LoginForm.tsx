"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
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
      <input name="password" type="password" required autoComplete="current-password" placeholder="Kata sandi" className="field" />
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <button disabled={busy} className="btn btn-primary w-full">{busy ? "Memproses…" : "Masuk"}</button>
    </form>
  );
}
