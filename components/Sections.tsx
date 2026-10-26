import Link from "next/link";
import type { Content } from "@/types/content";

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-7 flex items-center gap-3 text-3xl font-extrabold tracking-tight">
      {children}
    </h2>
  );
}
const Linkify = ({ text }: { text: string }) => (
  <>{text.split(/(https?:\/\/\S+)/g).map((p, i) =>
    /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-sea underline">{p}</a> : p)}</>
);
const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const wa = (n: string) => `https://wa.me/62${n.replace(/^0/, "").replace(/\D/g, "")}`;

export function Hero({ c }: { c: Content }) {
  return (
    <section className="bg-gradient-to-b from-[#9BD38A] via-[#8DBBD8] to-[#C4F4D8]">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-20 md:pb-32 md:pt-28">
        <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">{c.hero.judul}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">{c.hero.subjudul}</p>
        <a href="#magang" className="btn btn-primary mt-9">Daftar magang</a>
      </div>
    </section>
  );
}
export function Program({ c }: { c: Content }) {
  return (
    <section id="program" className="mx-auto max-w-6xl px-5 pt-16">
      <Title>Program</Title>
      <ul className="-mt-10 grid gap-5 pt-10 sm:grid-cols-2 lg:grid-cols-5">
        {c.program.map((p) => (
          <li key={p.kode} className="card p-6">
            {p.gambar ? (
              <img src={p.gambar} alt={p.kode} className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-leaf to-sea text-2xl font-bold text-white shadow-lg" aria-hidden>J</span>
            )}
            <h3 className="mt-5 text-lg font-bold">{p.kode}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{p.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
export function VisiMisi({ c }: { c: Content }) {
  return (
    <section id="visi-misi" className="mx-auto max-w-6xl px-5 pt-24">
      <Title>Visi & Misi</Title>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-7"><h3 className="text-lg font-bold">Visi</h3><p className="mt-3 leading-relaxed text-muted">{c.visi}</p></div>
        <div className="card p-7"><h3 className="text-lg font-bold">Misi</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-muted marker:text-sea">{c.misi.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}
export function Informasi({ c }: { c: Content }) {
  return (
    <section id="informasi" className="mx-auto max-w-6xl px-5 pt-24">
      <Title>Informasi</Title>
      <ul className="card space-y-3 p-4 md:p-6">
        {c.informasi.map((t, i) => <li key={i} className="rounded-2xl border border-edge bg-white px-5 py-4 text-[15px] leading-relaxed"><Linkify text={t} /></li>)}
      </ul>
    </section>
  );
}
export function Kontak({ c }: { c: Content }) {
  return (
    <section id="kontak" className="mx-auto max-w-6xl px-5 pt-24">
      <Title>Kontak</Title>
      <div className="card max-w-xl p-6">
        <h3 className="mb-3 font-bold">Hubungi</h3>
        <ul className="space-y-2.5">
          {c.kontak.map((k) => (
            <li key={k.nama}><a href={wa(k.telp)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-edge px-5 py-4 font-semibold transition hover:border-leaf">
              <span>{k.nama}</span><span className="text-sea">{k.telp}</span></a></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
export function Alamat({ c }: { c: Content }) {
  return (
    <section id="alamat" className="mx-auto max-w-6xl px-5 pt-24">
      <Title>Alamat</Title>
      <ul className="grid gap-5 md:grid-cols-2">
        {c.alamat.map((a) => (
          <li key={a.nama} className="card p-6">
            <h3 className="font-bold">{a.nama}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{a.alamat}</p>
            <a href={mapsUrl(`BPJS Ketenagakerjaan ${a.nama} ${a.alamat}`)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-sea hover:underline">Buka di Google Maps</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
export function Magang({ c }: { c: Content }) {
  return (
    <section id="magang" className="mx-auto max-w-6xl px-5 pt-24">
      <Title>Magang</Title>
      <div className="card p-7">
        <Link href="/daftar" className="text-lg font-semibold text-sea hover:underline">Klik untuk Mendaftar</Link>
      </div>
    </section>
  );
}
