import Link from "next/link";
import type { Content } from "@/types/content";

const wrap = "mx-auto max-w-6xl px-5";
const URL_RE = /(https?:\/\/[^\s]+)/g;

// Kata kunci pada nama kantor -> link Google Maps
const MAPS: [string, string][] = [
  ["sleman", "https://maps.app.goo.gl/FfyFGecHMcitdQvK9"],
  ["bantul", "https://maps.app.goo.gl/zQrBvsEwfQe8ekYbA"],
  ["gunung", "https://maps.app.goo.gl/hEdeM498Yone6FZ27"], // Gunungkidul / Gunung Kidul
  ["kulon", "https://maps.app.goo.gl/wJu76X756gYhjWYp6"], // Kulon Progo / Kulonprogo
  ["yogya", "https://maps.app.goo.gl/EHPFGxgJc2B7CNsh6"], // Cabang Induk Yogyakarta
];

// Pengali skala ikon program supaya semua ikon terlihat sama besar.
// Ikon yang punya ruang kosong lebih banyak di dalam filenya diberi skala > 1.
// Ubah angkanya kalau masih terlalu kecil / terlalu besar.
const SKALA_IKON: Record<string, number> = {
  JKK: 1.25,
  JHT: 1.6,
};

function linkMaps(nama: string, alamat: string) {
  const n = nama.toLowerCase();
  const hit = MAPS.find(([kunci]) => n.includes(kunci));
  return hit
    ? hit[1]
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nama} ${alamat}`)}`;
}

function Teks({ t }: { t: string }) {
  return (
    <>
      {t.split(URL_RE).map((s, i) =>
        /^https?:\/\//.test(s) ? (
          <a key={i} href={s} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-sea hover:underline">
            {s}
          </a>
        ) : (
          <span key={i}>{s}</span>
        )
      )}
    </>
  );
}

export function Hero({ c }: { c: Content }) {
  return (
    <section className="bg-gradient-to-b from-[#9BD38A] via-[#8DBBD8] to-[#C4F4D8]">
      <div className={`${wrap} py-20 sm:py-28`}>
        <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-ink sm:text-6xl">{c.hero.judul}</h1>
        <p className="mt-6 max-w-2xl text-lg text-ink/70">{c.hero.subjudul}</p>
        <Link href="/daftar" className="btn btn-primary mt-8">Daftar magang</Link>
      </div>
    </section>
  );
}

export function Program({ c }: { c: Content }) {
  return (
    <section id="program" className={`${wrap} pt-16`}>
      <h2 className="text-3xl font-extrabold">Program</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {c.program.map((p, i) => (
          <div key={i} className="card p-6">
            <div className="flex h-16 w-16 items-center justify-center overflow-visible">
              {p.gambar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.gambar}
                  alt={p.kode}
                  className="h-16 w-16 object-contain"
                  style={{ transform: `scale(${SKALA_IKON[p.kode] ?? 1})` }}
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-paper text-2xl font-bold text-sea">
                  {p.kode.charAt(0)}
                </span>
              )}
            </div>
            <h3 className="mt-4 text-lg font-bold">{p.kode}</h3>
            <p className="mt-1 text-sm text-muted">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VisiMisi({ c }: { c: Content }) {
  return (
    <section id="visi" className={`${wrap} pt-16`}>
      <h2 className="text-3xl font-extrabold">Visi &amp; Misi</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-bold">Visi</h3>
          <p className="mt-2 leading-relaxed text-muted">{c.visi}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-bold">Misi</h3>
          <ol className="mt-2 space-y-2 text-muted">
            {c.misi.map((m, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-bold text-sea">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{m}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function Informasi({ c }: { c: Content }) {
  return (
    <section id="informasi" className={`${wrap} pt-16`}>
      <h2 className="text-3xl font-extrabold">Informasi</h2>
      <div className="card mt-6 divide-y divide-edge">
        {c.informasi.map((t, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 sm:px-7">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-bold text-sea">
              {i + 1}
            </span>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
              <Teks t={t} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Kontak({ c }: { c: Content }) {
  return (
    <section id="kontak" className={`${wrap} pt-16`}>
      <h2 className="text-3xl font-extrabold">Kontak</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {c.kontak.map((k, i) => (
          <div key={i} className="card p-5">
            <p className="font-semibold">{k.nama}</p>
            <a href={`tel:${k.telp.replace(/\s+/g, "")}`} className="mt-1 block text-sea hover:underline">
              {k.telp}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Alamat({ c }: { c: Content }) {
  return (
    <section id="alamat" className={`${wrap} pt-16`}>
      <h2 className="text-3xl font-extrabold">Alamat</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {c.alamat.map((a, i) => (
          <a
            key={i}
            href={linkMaps(a.nama, a.alamat)}
            target="_blank"
            rel="noopener noreferrer"
            className="card block p-5 transition hover:shadow-md"
          >
            <p className="font-semibold">{a.nama}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{a.alamat}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-sea">Buka di Google Maps</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function Magang({ c: _c }: { c: Content }) {
  return (
    <section id="magang" className={`${wrap} pt-16`}>
      <h2 className="text-3xl font-extrabold">Magang</h2>
      <div className="card mt-6 p-6">
        <Link href="/daftar" className="font-semibold text-sea hover:underline">Klik untuk Mendaftar</Link>
      </div>
    </section>
  );
}