"use client";
import Link from "next/link";
import { useState } from "react";

const MAX = 2 * 1024 * 1024;
const petunjuk: [string, React.ReactNode][] = [
  ["✅", "Isi semua kolom dengan lengkap dan benar."],
  ["📄", <>Upload <b>CV</b> & <b>Surat Permohonan</b> dalam format <b>PDF</b> maksimal 2MB.</>],
  ["📅", <>Durasi magang minimal <b>3 bulan</b>.</>],
  ["📧", "Gunakan email aktif untuk konfirmasi."],
];

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        required
        className="field mt-1.5 font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium"
        {...rest}
      />
    </label>
  );
}

export default function DaftarForm() {
  const [info, setInfo] = useState(true);
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  function tutup() {
    setClosing(true);
    setTimeout(() => setInfo(false), 200);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const data = new FormData(e.currentTarget);
    for (const [k, nama] of [["cv", "CV"], ["surat", "Surat permohonan"]]) {
      const file = data.get(k) as File;
      if (file.type !== "application/pdf" || file.size > MAX) return setErr(`${nama} harus PDF, maksimal 2MB.`);
    }
    setBusy(true);
    const r = await fetch("/api/daftar", { method: "POST", body: data }).catch(() => null);
    setBusy(false);
    if (r?.ok) { setDone(true); window.scrollTo({ top: 0 }); }
    else setErr((await r?.json().catch(() => null))?.error ?? "Gagal mengirim. Coba lagi.");
  }

  if (done)
    return (
      <div className="card w-full p-6 text-center sm:p-8">
        <h1 className="text-xl font-extrabold sm:text-2xl">Pendaftaran terkirim</h1>
        <p className="mt-3 text-muted">Terima kasih. Tim kami akan menghubungi Anda lewat email atau nomor HP yang didaftarkan.</p>
        <Link href="/" className="btn btn-primary mt-6">Kembali ke beranda</Link>
      </div>
    );

  return (
    <>
      {info && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 ${closing ? "anim-fade-out" : "anim-fade-in"}`}
          role="dialog" aria-modal="true" aria-labelledby="judul-petunjuk"
        >
          <div className={`max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8 ${closing ? "anim-zoom-out" : "anim-zoom-in"}`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-sky-400 text-3xl text-sky-400 sm:h-20 sm:w-20 sm:text-4xl" aria-hidden>i</div>
            <h2 id="judul-petunjuk" className="mt-4 text-center text-xl font-extrabold sm:mt-5 sm:text-2xl">Petunjuk Pengisian Formulir</h2>
            <ul className="mt-5 space-y-3 text-[15px] sm:mt-6">
              {petunjuk.map(([ikon, teks], i) => <li key={i} className="flex gap-3"><span aria-hidden>{ikon}</span><span>{teks}</span></li>)}
            </ul>
            <div className="mt-7 flex justify-center sm:mt-8">
              <button autoFocus onClick={tutup} className="btn w-full bg-sea px-8 text-white hover:bg-ink sm:w-auto">Saya Mengerti</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="card w-full space-y-4 p-5 sm:p-7">
        <header className="border-b border-edge pb-4 text-center">
          <h1 className="text-xl font-extrabold sm:text-2xl">Form Pendaftaran Magang</h1>
          <p className="text-sm text-muted">BPJS Ketenagakerjaan</p>
        </header>
        <Field label="Nama Lengkap" name="nama" autoComplete="name" />
        <Field label="Email" name="email" type="email" inputMode="email" autoComplete="email" />
        <Field label="Nomor HP" name="hp" type="tel" inputMode="tel" autoComplete="tel" />
        <Field label="Asal Universitas" name="universitas" autoComplete="organization" />
        <Field label="Jurusan" name="jurusan" />
        <Field label="Durasi Magang (Bulan)" name="durasi" type="number" inputMode="numeric" min={3} max={24} />
        <Field label="Upload CV (PDF, Max 2MB)" name="cv" type="file" accept="application/pdf" />
        <Field label="Upload Surat Permohonan Magang (PDF, Max 2MB)" name="surat" type="file" accept="application/pdf" />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="btn min-h-[48px] w-full bg-[#E60028] text-white hover:bg-[#c40022] disabled:opacity-60">{busy ? "Mengirim…" : "Kirim Pendaftaran"}</button>
      </form>
    </>
  );
}