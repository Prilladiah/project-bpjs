import { listPendaftar, statusOf, type Pendaftar } from "@/lib/pendaftar";

// Nama tampil di tabel publik selama sekian hari setelah diterima
const HARI_TAMPIL = 7;

const masihTampil = (p: Pendaftar) =>
  Date.now() - new Date(p.diterimaPada ?? p.waktu).getTime() <= HARI_TAMPIL * 86_400_000;

export default async function DiterimaSection() {
  let data: Pendaftar[] = [];
  try {
    data = (await listPendaftar())
      .filter((p) => statusOf(p) === "diterima" && masihTampil(p))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  } catch {
    return null;
  }

  return (
    <section id="diterima" className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:pt-16">
      <h2 className="text-2xl font-extrabold sm:text-3xl">Peserta Magang Diterima</h2>
      <p className="mt-1 text-sm text-muted">{data.length} peserta</p>

      {data.length === 0 ? (
        <p className="card mt-4 p-6 text-center text-muted">Belum ada peserta yang diterima.</p>
      ) : (
        <div className="card mt-4 max-h-[480px] overflow-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 border-b border-edge bg-white uppercase tracking-wide text-muted">
              <tr>
                {["No", "Nama Lengkap", "Jurusan", "Universitas"].map((h) => (
                  <th key={h} className="px-2 py-3 font-semibold sm:px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {data.map((p, i) => (
                <tr key={p.id} className={i % 2 ? "" : "bg-paper/60"}>
                  <td className="px-2 py-3 text-muted sm:px-4">{i + 1}</td>
                  <td className="px-2 py-3 font-semibold sm:px-4">{p.nama}</td>
                  <td className="px-2 py-3 sm:px-4">{p.jurusan}</td>
                  <td className="px-2 py-3 sm:px-4">{p.universitas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}