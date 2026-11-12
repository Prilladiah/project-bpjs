import { listPendaftar, statusOf, type Pendaftar } from "./pendaftar";
import { HARI_PERINGATAN, HARI_SLOT_KEMBALI, KANTOR } from "./kantor";
import { getKuotaMap } from "./pengaturan";
import { hariIni, selisihHari, tambahHari } from "./tanggal";

export type Peserta = Pendaftar & { tanggalMulai: string; tanggalSelesai: string };

const berjadwal = (p: Pendaftar): p is Peserta => !!p.tanggalMulai && !!p.tanggalSelesai;
const urut = (a: Peserta, b: Peserta) =>
  a.tanggalSelesai.localeCompare(b.tanggalSelesai) || a.nama.localeCompare(b.nama);

// Peserta magang = yang DITERIMA dan belum selesai, tanggal keluar paling cepat di atas
export async function listPeserta(): Promise<Peserta[]> {
  const today = hariIni();
  return (await listPendaftar())
    .filter((p): p is Peserta => berjadwal(p) && statusOf(p) === "diterima" && p.tanggalSelesai >= today)
    .sort(urut);
}

// Yang menempati slot kuota = menunggu + diterima (yang ditolak tidak)
async function listSlot(): Promise<Peserta[]> {
  const today = hariIni();
  return (await listPendaftar())
    .filter((p): p is Peserta => berjadwal(p) && statusOf(p) !== "ditolak" && p.tanggalSelesai >= today)
    .sort(urut);
}

export async function hitungKuota() {
  const [slot, kuotaMap] = await Promise.all([listSlot(), getKuotaMap()]);
  const batas = tambahHari(hariIni(), HARI_SLOT_KEMBALI);
  return KANTOR.map((kantor) => {
    const di = slot.filter((p) => p.kantor === kantor.id);
    const terisi = di.filter((p) => p.tanggalSelesai > batas).length;
    const max = kuotaMap[kantor.id];
    return {
      kantor,
      terisi,
      max,
      sisa: Math.max(0, max - terisi),
      penuh: terisi >= max,
      segeraKeluar: di.length - terisi,
    };
  });
}

// Angka untuk dashboard di bagian atas halaman admin
export async function ringkasan() {
  const today = hariIni();
  const semua = await listPendaftar();
  const diterima = semua.filter((p) => statusOf(p) === "diterima");
  const menunggu = semua.filter((p) => statusOf(p) === "menunggu");
  const aktif = diterima.filter(
    (p): p is Peserta => berjadwal(p) && p.tanggalMulai <= today && p.tanggalSelesai >= today
  );
  const akanKeluar = aktif.filter((p) => selisihHari(today, p.tanggalSelesai) <= HARI_PERINGATAN);
  return {
    mendaftar: menunggu.length, // hanya yang belum diterima/ditolak
    diterima: diterima.length,
    magang: aktif.length,
    akanKeluar: akanKeluar.length,
  };
}