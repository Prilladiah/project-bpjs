import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifyToken } from "@/lib/auth";
import { KANTOR } from "@/lib/kantor";
import { getConfig, parseEmails, simpanConfig } from "@/lib/notifikasi-config";
import { getRiwayat, jalankanNotifikasi, kirimUji, MILESTONE } from "@/lib/notifikasi";
import { emailSiap } from "@/lib/email";

export const metadata = { title: "Notifikasi email" };
export const dynamic = "force-dynamic";

const kembali = (pesan: string) => redirect(`/admin/notifikasi?hasil=${encodeURIComponent(pesan)}`);
const cek = async () => !!(await verifyToken(cookies().get(COOKIE)?.value));

async function simpan(formData: FormData) {
  "use server";
  if (!(await cek())) return;
  const mentor: Record<string, string[]> = {};
  for (const k of KANTOR) mentor[k.id] = parseEmails(String(formData.get(k.id) ?? ""));
  await simpanConfig({ admin: parseEmails(String(formData.get("admin") ?? "")), mentor });
  kembali("Pengaturan disimpan.");
}

async function kirimSekarang() {
  "use server";
  if (!(await cek())) return;
  kembali((await jalankanNotifikasi()).pesan);
}

async function uji() {
  "use server";
  if (!(await cek())) return;
  kembali((await kirimUji()).pesan);
}

export default async function Notifikasi({ searchParams }: { searchParams: { hasil?: string } }) {
  const [cfg, riwayat] = await Promise.all([getConfig(), getRiwayat()]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-extrabold">Notifikasi email</h1>
      <p className="mt-1 text-sm text-muted">
        Email otomatis dikirim saat peserta tinggal {MILESTONE.join(", ")} hari lagi berakhir, dan saat slot kuota
        terbuka. Isi lebih dari satu email dengan pemisah koma.
      </p>

      {!emailSiap() && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Email belum diatur. Isi APPS_SCRIPT_URL dan APPS_SCRIPT_SECRET di Environment Variables lalu Redeploy.
        </p>
      )}
      {searchParams.hasil && (
        <p role="status" className="mt-4 rounded-xl border border-edge bg-white p-4 text-sm font-semibold">
          {searchParams.hasil}
        </p>
      )}

      <form action={simpan} className="card mt-6 space-y-5 p-6">
        <label className="block text-sm font-semibold">
          Email admin (menerima semua kantor)
          <input
            name="admin"
            defaultValue={cfg.admin.join(", ")}
            placeholder="admin@contoh.com"
            className="field mt-1.5 font-normal"
          />
        </label>

        {(["cabang", "kcp"] as const).map((j) => (
          <section key={j}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Email mentor — {j === "cabang" ? "Kantor Cabang" : "KCP"}
            </h2>
            <div className="space-y-3">
              {KANTOR.filter((k) => k.jenis === j).map((k) => (
                <label key={k.id} className="block text-sm font-semibold">
                  {k.nama}
                  <input
                    name={k.id}
                    defaultValue={(cfg.mentor[k.id] ?? []).join(", ")}
                    placeholder="mentor@contoh.com"
                    className="field mt-1.5 font-normal"
                  />
                </label>
              ))}
            </div>
          </section>
        ))}
        <button className="btn btn-primary w-full sm:w-auto">Simpan penerima</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <form action={uji}>
          <button className="btn border border-edge bg-white">Kirim email uji ke admin</button>
        </form>
        <form action={kirimSekarang}>
          <button className="btn border border-edge bg-white">Cek &amp; kirim notifikasi sekarang</button>
        </form>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold">Riwayat pengiriman</h2>
      {riwayat.length === 0 ? (
        <p className="card p-6 text-center text-sm text-muted">Belum ada email terkirim.</p>
      ) : (
        <div className="card divide-y divide-edge text-sm">
          {riwayat.map((r, i) => (
            <div key={i} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{r.subjek}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    r.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.ok ? "Terkirim" : "Gagal"}
                </span>
              </div>
              <p className="mt-1 text-muted">
                {new Date(r.waktu).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Jakarta",
                })}{" "}
                · ke {r.ke.join(", ")}
              </p>
              {r.error && <p className="mt-1 text-red-600">{r.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}