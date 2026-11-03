import { listPeserta, hitungKuota } from "@/lib/kuota";
import { KANTOR, getKantor, HARI_PERINGATAN, HARI_SLOT_KEMBALI } from "@/lib/kantor";
import { hariIni, selisihHari } from "@/lib/tanggal";

export const metadata = { title: "Peserta magang" };
export const dynamic = "force-dynamic";

const tgl = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "UTC" });

const sisaText = (n: number) => (n <= 0 ? "Berakhir hari ini" : `Berakhir ${n} hari lagi`);

export default async function Magang({ searchParams }: { searchParams: { kantor?: string } }) {
  const today = hariIni();
  const [semua, kuota] = await Promise.all([listPeserta(), hitungKuota()]);
  const filter = searchParams.kantor ?? "";
  const data = filter ? semua.filter((p) => p.kantor === filter) : semua; // sudah urut tanggal keluar ascending
  const segera = semua.filter((p) => selisihHari(today, p.tanggalSelesai) <= HARI_PERINGATAN);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Peserta magang saat ini</h1>
          <p className="mt-1 text-sm text-muted">{data.length} dari {semua.length} peserta</p>
        </div>
        <form className="flex gap-2">
          <select name="kantor" defaultValue={filter} className="field w-64">
            <option value="">Semua kantor</option>
            {(["cabang", "kcp"] as const).map((j) => (
              <optgroup key={j} label={j === "cabang" ? "Kantor Cabang" : "KCP"}>
                {KANTOR.filter((k) => k.jenis === j).map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button className="btn btn-primary">Terapkan</button>
        </form>
      </div>

      {segera.length > 0 && (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <p className="font-bold">
            ⚠ {segera.length} peserta akan berakhir dalam {HARI_PERINGATAN / 7} minggu ke depan
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {segera.map((p) => (
              <li key={p.id}>
                <b>{p.nama}</b> ({getKantor(p.kantor ?? "")?.nama ?? "-"}) · keluar {tgl(p.tanggalSelesai)} ·{" "}
                {sisaText(selisihHari(today, p.tanggalSelesai))}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Kuota per kantor</h2>
          <a href="/admin/kuota" className="text-sm font-semibold text-sea hover:underline">Atur kuota</a>
        </div>
        {(["cabang", "kcp"] as const).map((j) => (
          <div key={j} className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {j === "cabang" ? "Kantor Cabang" : "KCP"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {kuota.filter((k) => k.kantor.jenis === j).map((k) => (
                <div key={k.kantor.id} className="card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{k.kantor.nama}</span>
                    <span className={`text-sm font-bold ${k.penuh ? "text-red-600" : "text-sea"}`}>
                      {k.terisi}/{k.max}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-edge">
                    <div
                      className={`h-full ${k.penuh ? "bg-red-500" : "bg-sea"}`}
                      style={{ width: `${k.max > 0 ? Math.min(100, (k.terisi / k.max) * 100) : 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {k.penuh ? "Penuh" : `Sisa ${k.sisa} slot`}
                    {k.segeraKeluar > 0 &&
                      ` · ${k.segeraKeluar} peserta keluar ≤ ${HARI_SLOT_KEMBALI} hari (slot sudah dihitung kosong)`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {data.length === 0 ? (
        <p className="card p-8 text-center text-muted">Belum ada peserta magang aktif.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-edge text-xs uppercase tracking-wide text-muted">
              <tr>
                {["No", "Nama", "Kantor", "Tanggal masuk", "Tanggal keluar", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {data.map((p, i) => {
                const sisa = selisihHari(today, p.tanggalSelesai);
                const hampir = sisa <= HARI_PERINGATAN;
                const belumMulai = p.tanggalMulai > today;
                return (
                  <tr key={p.id} className={hampir ? "bg-amber-50" : ""}>
                    <td className="px-4 py-4 text-muted">{i + 1}</td>
                    <td className="px-4 py-4 font-semibold">{p.nama}</td>
                    <td className="px-4 py-4">{getKantor(p.kantor ?? "")?.nama ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-4">{tgl(p.tanggalMulai)}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold">{tgl(p.tanggalSelesai)}</td>
                    <td className="px-4 py-4">
                      {hampir ? (
                        <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
                          {sisaText(sisa)}
                        </span>
                      ) : belumMulai ? (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                          Akan mulai
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Aktif
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}