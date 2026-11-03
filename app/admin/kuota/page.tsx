import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE, verifyToken } from "@/lib/auth";
import { KANTOR, KUOTA, HARI_SLOT_KEMBALI } from "@/lib/kantor";
import { getKuotaMap, simpanKuotaMap } from "@/lib/pengaturan";
import { hitungKuota } from "@/lib/kuota";

export const metadata = { title: "Kuota magang" };
export const dynamic = "force-dynamic";

async function simpan(formData: FormData) {
  "use server";
  if (!(await verifyToken(cookies().get(COOKIE)?.value))) return;
  const map: Record<string, number> = {};
  for (const k of KANTOR) {
    const v = Math.floor(Number(formData.get(k.id)));
    map[k.id] = Number.isFinite(v) ? Math.min(500, Math.max(0, v)) : KUOTA[k.jenis];
  }
  await simpanKuotaMap(map);
  revalidatePath("/admin/kuota");
  revalidatePath("/admin/magang");
  revalidatePath("/daftar");
}

export default async function Kuota() {
  const [map, info] = await Promise.all([getKuotaMap(), hitungKuota()]);
  const data = Object.fromEntries(info.map((i) => [i.kantor.id, i]));

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-extrabold">Kuota magang</h1>
      <p className="mt-1 text-sm text-muted">
        Atur jumlah maksimal peserta magang per kantor. Peserta yang keluar dalam {HARI_SLOT_KEMBALI} hari
        otomatis tidak dihitung, sehingga slotnya terbuka kembali.
      </p>

      <form action={simpan} className="card mt-6 space-y-6 p-6">
        {(["cabang", "kcp"] as const).map((j) => (
          <section key={j}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {j === "cabang" ? "Kantor Cabang" : "Kantor Cabang Perintis (KCP)"}
            </h2>
            <div className="space-y-4">
              {KANTOR.filter((k) => k.jenis === j).map((k) => {
                const i = data[k.id];
                return (
                  <label key={k.id} className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
                    <span>
                      {k.nama}
                      <span className="ml-2 font-normal text-muted">
                        terisi {i?.terisi ?? 0}
                        {i && i.segeraKeluar > 0 && ` · ${i.segeraKeluar} slot dilepas (keluar ≤ ${HARI_SLOT_KEMBALI} hari)`}
                      </span>
                    </span>
                    <input
                      name={k.id}
                      type="number"
                      min={0}
                      max={500}
                      required
                      defaultValue={map[k.id]}
                      className="field w-28 text-right font-normal"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        <button className="btn btn-primary w-full sm:w-auto">Simpan kuota</button>
      </form>
    </div>
  );
}