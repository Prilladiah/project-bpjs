import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { listPendaftar, hapusPendaftar } from "@/lib/pendaftar";
import { getKantor } from "@/lib/kantor";
import { COOKIE, verifyToken } from "@/lib/auth";
import HapusButton from "@/components/hapusbutton";

export const metadata = { title: "Data pendaftar" };
export const dynamic = "force-dynamic";

async function hapus(formData: FormData) {
  "use server";
  if (!(await verifyToken(cookies().get(COOKIE)?.value))) return;
  await hapusPendaftar(String(formData.get("id")));
  revalidatePath("/admin/pendaftar");
  revalidatePath("/admin/magang");
}

const tgl = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "UTC" });

export default async function Pendaftar({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const semua = await listPendaftar();
  const namaKantor = (id?: string) => getKantor(id ?? "")?.nama ?? "-";
  const data = q
    ? semua.filter((p) =>
        [p.nama, p.email, p.universitas, p.jurusan, namaKantor(p.kantor)].some((s) => s.toLowerCase().includes(q)))
    : semua;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Data pendaftar</h1>
          <p className="mt-1 text-sm text-muted">{data.length} dari {semua.length} pendaftar</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={searchParams.q} placeholder="Cari nama, email, kampus, kantor…" className="field w-64" />
          <button className="btn btn-primary">Cari</button>
        </form>
      </div>

      {data.length === 0 ? (
        <p className="card p-8 text-center text-muted">{semua.length === 0 ? "Belum ada pendaftar." : "Tidak ada hasil yang cocok."}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-edge text-xs uppercase tracking-wide text-muted">
              <tr>{["Tanggal daftar", "Nama", "Kontak", "Kampus & jurusan", "Kantor tujuan", "Periode magang", "Berkas", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {data.map((p) => (
                <tr key={p.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-4 text-muted">
                    {new Date(p.waktu).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })}
                  </td>
                  <td className="px-4 py-4 font-semibold">{p.nama}</td>
                  <td className="px-4 py-4"><div>{p.email}</div><div className="text-muted">{p.hp}</div></td>
                  <td className="px-4 py-4"><div>{p.universitas}</div><div className="text-muted">{p.jurusan}</div></td>
                  <td className="px-4 py-4">{namaKantor(p.kantor)}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {p.tanggalMulai && p.tanggalSelesai ? (
                      <>
                        <div>{tgl(p.tanggalMulai)} – {tgl(p.tanggalSelesai)}</div>
                        <div className="text-muted">{p.durasi} bulan</div>
                      </>
                    ) : (
                      <div>{p.durasi} bulan</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {p.zipUrl ? (
                      <a href={`/admin/berkas/${p.id}.zip`} download={`${p.nama}.zip`} className="font-semibold text-sea hover:underline">
                        Unduh ZIP
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4"><HapusButton id={p.id} nama={p.nama} action={hapus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}