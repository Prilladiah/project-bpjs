"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Content } from "@/types/content";

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 border-b border-edge pb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-dashed border-edge py-3 text-sm font-semibold text-sea transition hover:bg-paper"
    >
      + {label}
    </button>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
    >
      Hapus
    </button>
  );
}

const Num = ({ n }: { n: number }) => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-bold text-muted">
    {n}
  </span>
);

export default function AdminEditor({ initial }: { initial: Content }) {
  const router = useRouter();
  const [c, setC] = useState<Content>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Content>(k: K, v: Content[K]) => setC((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/content", {
      method: "PUT",
      body: JSON.stringify(c),
      headers: { "Content-Type": "application/json" },
    }).catch(() => null);
    setBusy(false);
    setMsg(r?.ok ? { ok: true, text: "Tersimpan. Halaman publik sudah diperbarui." } : { ok: false, text: "Gagal menyimpan." });
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 pb-12 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Kelola konten</h1>
        <div className="flex flex-wrap items-center gap-2">
          {msg && (
            <span role="status" className={`text-sm font-semibold ${msg.ok ? "text-sea" : "text-red-600"}`}>
              {msg.text}
            </span>
          )}
          <a href="/" target="_blank" className="btn border border-edge bg-white">Lihat situs</a>
          <button onClick={logout} className="btn border border-edge bg-white">Keluar</button>
          <button onClick={save} disabled={busy} className="btn btn-primary disabled:opacity-60">
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>

      {/* INFORMASI */}
      <Group title="Informasi" hint="Poin-poin informasi untuk calon peserta magang.">
        {c.informasi.map((t, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-edge p-3">
            <Num n={i + 1} />
            <textarea
              className="field min-h-[96px] flex-1"
              rows={4}
              value={t}
              placeholder="Tulis informasi…"
              onChange={(e) => set("informasi", c.informasi.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <DeleteButton onClick={() => set("informasi", c.informasi.filter((_, j) => j !== i))} />
          </div>
        ))}
        {c.informasi.length === 0 && <p className="py-2 text-center text-sm text-muted">Belum ada informasi.</p>}
        <AddButton label="Tambah informasi" onClick={() => set("informasi", [...c.informasi, ""])} />
      </Group>

      {/* KONTAK */}
      <Group title="Kontak" hint="Nama dan nomor telepon yang bisa dihubungi.">
        <div className="hidden grid-cols-[28px_1fr_1fr_64px] gap-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
          <span />
          <span>Nama</span>
          <span>Nomor telepon</span>
          <span />
        </div>
        {c.kontak.map((k, i) => (
          <div key={i} className="grid items-center gap-3 rounded-2xl border border-edge p-3 md:grid-cols-[28px_1fr_1fr_64px]">
            <Num n={i + 1} />
            <input
              className="field"
              value={k.nama}
              placeholder="Nama"
              aria-label="Nama"
              onChange={(e) => set("kontak", c.kontak.map((x, j) => (j === i ? { ...x, nama: e.target.value } : x)))}
            />
            <input
              className="field"
              value={k.telp}
              placeholder="Nomor telepon"
              aria-label="Nomor telepon"
              inputMode="tel"
              onChange={(e) => set("kontak", c.kontak.map((x, j) => (j === i ? { ...x, telp: e.target.value } : x)))}
            />
            <DeleteButton onClick={() => set("kontak", c.kontak.filter((_, j) => j !== i))} />
          </div>
        ))}
        {c.kontak.length === 0 && <p className="py-2 text-center text-sm text-muted">Belum ada kontak.</p>}
        <AddButton label="Tambah kontak" onClick={() => set("kontak", [...c.kontak, { nama: "", telp: "" }])} />
      </Group>

      {/* ALAMAT */}
      <Group title="Alamat" hint="Daftar kantor beserta alamat lengkapnya.">
        {c.alamat.map((a, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-edge p-3">
            <Num n={i + 1} />
            <div className="grid flex-1 gap-2">
              <input
                className="field"
                value={a.nama}
                placeholder="Nama kantor"
                aria-label="Nama kantor"
                onChange={(e) => set("alamat", c.alamat.map((x, j) => (j === i ? { ...x, nama: e.target.value } : x)))}
              />
              <textarea
                className="field"
                rows={3}
                value={a.alamat}
                placeholder="Alamat lengkap"
                aria-label="Alamat lengkap"
                onChange={(e) => set("alamat", c.alamat.map((x, j) => (j === i ? { ...x, alamat: e.target.value } : x)))}
              />
            </div>
            <DeleteButton onClick={() => set("alamat", c.alamat.filter((_, j) => j !== i))} />
          </div>
        ))}
        {c.alamat.length === 0 && <p className="py-2 text-center text-sm text-muted">Belum ada alamat.</p>}
        <AddButton label="Tambah alamat" onClick={() => set("alamat", [...c.alamat, { nama: "", alamat: "" }])} />
      </Group>
    </div>
  );
}