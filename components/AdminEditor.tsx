"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Content } from "@/types/content";

type Field<T> = { key: keyof T & string; label: string; long?: boolean };

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card space-y-3 p-6"><h2 className="font-bold">{title}</h2>{children}</section>;
}
function Strings({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  return (
    <>
      {items.map((t, i) => (
        <div key={i} className="flex gap-2">
          <textarea className="field min-h-[44px]" rows={2} value={t} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className="px-2 text-sm text-red-600" onClick={() => onChange(items.filter((_, j) => j !== i))}>Hapus</button>
        </div>
      ))}
      <button type="button" className="text-sm font-semibold text-sea" onClick={() => onChange([...items, ""])}>+ Tambah</button>
    </>
  );
}
function Rows<T extends Record<string, string>>({ items, fields, onChange, blank }: { items: T[]; fields: Field<T>[]; onChange: (v: T[]) => void; blank: T }) {
  return (
    <>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 rounded-2xl border border-edge p-3">
          <div className="grid flex-1 gap-2 md:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className={`text-xs text-muted ${f.long ? "md:col-span-2" : ""}`}>{f.label}
                {f.long
                  ? <textarea className="field mt-1" rows={2} value={it[f.key] ?? ""} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, [f.key]: e.target.value } : x)))} />
                  : <input className="field mt-1" value={it[f.key] ?? ""} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, [f.key]: e.target.value } : x)))} />}
              </label>
            ))}
          </div>
          <button type="button" className="px-2 text-sm text-red-600" onClick={() => onChange(items.filter((_, j) => j !== i))}>Hapus</button>
        </div>
      ))}
      <button type="button" className="text-sm font-semibold text-sea" onClick={() => onChange([...items, blank])}>+ Tambah</button>
    </>
  );
}

export default function AdminEditor({ initial }: { initial: Content }) {
  const router = useRouter();
  const [c, setC] = useState<Content>(initial);
  const [msg, setMsg] = useState("");
  const set = <K extends keyof Content>(k: K, v: Content[K]) => setC((p) => ({ ...p, [k]: v }));

  async function save() {
    setMsg("Menyimpan…");
    const r = await fetch("/api/content", { method: "PUT", body: JSON.stringify(c), headers: { "Content-Type": "application/json" } });
    setMsg(r.ok ? "Tersimpan. Halaman publik sudah diperbarui." : "Gagal menyimpan.");
  }
  async function logout() { await fetch("/api/logout", { method: "POST" }); router.push("/login"); router.refresh(); }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Kelola konten</h1>
        <div className="flex gap-2">
          <a href="/" target="_blank" className="btn border border-edge bg-white">Lihat situs</a>
          <button onClick={logout} className="btn border border-edge bg-white">Keluar</button>
          <button onClick={save} className="btn btn-primary">Simpan</button>
        </div>
      </div>
      {msg && <p role="status" className="text-sm text-sea">{msg}</p>}

      <Group title="Judul halaman">
        <input className="field" value={c.hero.judul} onChange={(e) => set("hero", { ...c.hero, judul: e.target.value })} />
        <textarea className="field" rows={2} value={c.hero.subjudul} onChange={(e) => set("hero", { ...c.hero, subjudul: e.target.value })} />
      </Group>
      <Group title="Program">
        <Rows
          items={c.program}
          fields={[
            { key: "kode", label: "Kode" },
            { key: "desc", label: "Deskripsi" },
            { key: "gambar", label: "Path gambar (contoh: /program/jkk.png, kosongkan untuk memakai huruf J)", long: true },
          ]}
          onChange={(v) => set("program", v)}
          blank={{ kode: "", desc: "", gambar: "" }}
        />
      </Group>
      <Group title="Visi"><textarea className="field" rows={3} value={c.visi} onChange={(e) => set("visi", e.target.value)} /></Group>
      <Group title="Misi"><Strings items={c.misi} onChange={(v) => set("misi", v)} /></Group>
      <Group title="Informasi"><Strings items={c.informasi} onChange={(v) => set("informasi", v)} /></Group>
      <Group title="Kontak"><Rows items={c.kontak} fields={[{ key: "nama", label: "Nama" }, { key: "telp", label: "Nomor telepon" }]} onChange={(v) => set("kontak", v)} blank={{ nama: "", telp: "" }} /></Group>
      <Group title="Alamat"><Rows items={c.alamat} fields={[{ key: "nama", label: "Nama kantor" }, { key: "alamat", label: "Alamat lengkap", long: true }]} onChange={(v) => set("alamat", v)} blank={{ nama: "", alamat: "" }} /></Group>
      <Group title="Teks footer"><input className="field" value={c.footer} onChange={(e) => set("footer", e.target.value)} /></Group>
    </div>
  );
}