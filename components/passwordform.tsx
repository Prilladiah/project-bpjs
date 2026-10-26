"use client";
import { useState } from "react";

export default function PasswordForm() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true); setMsg(null);
    const body = JSON.stringify(Object.fromEntries(new FormData(form)));
    const r = await fetch("/api/password", { method: "POST", body, headers: { "Content-Type": "application/json" } }).catch(() => null);
    setBusy(false);
    const data = await r?.json().catch(() => null);
    if (r?.ok) { form.reset(); setMsg({ ok: true, text: "Password berhasil diubah. Gunakan password baru saat login berikutnya." }); }
    else setMsg({ ok: false, text: data?.error ?? "Gagal mengubah password." });
  }

  const type = show ? "text" : "password";
  return (
    <form onSubmit={submit} className="card w-full space-y-4 p-6 text-left sm:p-7">
      <label className="block text-sm font-semibold">Password lama
        <input name="lama" type={type} required autoComplete="current-password" className="field mt-1.5 font-normal" />
      </label>
      <label className="block text-sm font-semibold">Password baru
        <input name="baru" type={type} required minLength={8} autoComplete="new-password" className="field mt-1.5 font-normal" />
        <span className="mt-1 block text-xs font-normal text-muted">Minimal 8 karakter.</span>
      </label>
      <label className="block text-sm font-semibold">Ulangi password baru
        <input name="konfirmasi" type={type} required minLength={8} autoComplete="new-password" className="field mt-1.5 font-normal" />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Tampilkan password
      </label>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      <button disabled={busy} className="btn btn-primary w-full disabled:opacity-60">{busy ? "Menyimpan…" : "Simpan password baru"}</button>
    </form>
  );
}