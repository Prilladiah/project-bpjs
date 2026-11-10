import { cookies } from "next/headers";
import ExcelJS from "exceljs";
import { COOKIE, verifyToken } from "@/lib/auth";
import { listPendaftar, statusOf } from "@/lib/pendaftar";
import { listPeserta } from "@/lib/kuota";
import { getKantor } from "@/lib/kantor";
import { getTerkirim } from "@/lib/notifikasi";
import { hariIni, selisihHari } from "@/lib/tanggal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await verifyToken(cookies().get(COOKIE)?.value))) return new Response("Unauthorized", { status: 401 });

  const jenis = new URL(req.url).searchParams.get("jenis");
  if (jenis !== "pendaftar" && jenis !== "magang") return new Response("Jenis tidak valid", { status: 400 });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(jenis === "pendaftar" ? "Pendaftar" : "Peserta magang");
  const kantor = (id?: string) => getKantor(id ?? "")?.nama ?? "-";
  const today = hariIni();

  if (jenis === "pendaftar") {
    const [data, terkirim] = await Promise.all([listPendaftar(), getTerkirim()]);
    ws.columns = [
      { header: "Tanggal daftar", key: "waktu", width: 20 },
      { header: "Nama", key: "nama", width: 28 },
      { header: "Email", key: "email", width: 30 },
      { header: "No HP", key: "hp", width: 16 },
      { header: "Universitas", key: "universitas", width: 28 },
      { header: "Jurusan", key: "jurusan", width: 22 },
      { header: "Kantor tujuan", key: "kantor", width: 22 },
      { header: "Tanggal mulai", key: "mulai", width: 14 },
      { header: "Tanggal selesai", key: "selesai", width: 14 },
      { header: "Durasi (bulan)", key: "durasi", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Diberitahu (Y/N)", key: "diberitahu", width: 16 },
    ];
    for (const p of data) {
      ws.addRow({
        waktu: new Date(p.waktu).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
        nama: p.nama,
        email: p.email,
        hp: p.hp,
        universitas: p.universitas,
        jurusan: p.jurusan,
        kantor: kantor(p.kantor),
        mulai: p.tanggalMulai ?? "",
        selesai: p.tanggalSelesai ?? "",
        durasi: p.durasi,
        status: statusOf(p),
        diberitahu: terkirim[`baru:${p.id}`] ? "Y" : "N",
      });
    }
  } else {
    const data = await listPeserta();
    ws.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama", key: "nama", width: 28 },
      { header: "Email", key: "email", width: 30 },
      { header: "No HP", key: "hp", width: 16 },
      { header: "Universitas", key: "universitas", width: 28 },
      { header: "Jurusan", key: "jurusan", width: 22 },
      { header: "Kantor", key: "kantor", width: 22 },
      { header: "Tanggal masuk", key: "mulai", width: 14 },
      { header: "Tanggal keluar", key: "selesai", width: 14 },
      { header: "Sisa hari", key: "sisa", width: 10 },
    ];
    data.forEach((p, i) =>
      ws.addRow({
        no: i + 1,
        nama: p.nama,
        email: p.email,
        hp: p.hp,
        universitas: p.universitas,
        jurusan: p.jurusan,
        kantor: kantor(p.kantor),
        mulai: p.tanggalMulai,
        selesai: p.tanggalSelesai,
        sisa: selisihHari(today, p.tanggalSelesai),
      })
    );
  }

  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = Buffer.from(await wb.xlsx.writeBuffer());
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${jenis}-${today}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}