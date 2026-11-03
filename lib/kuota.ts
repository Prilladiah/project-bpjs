import { listPendaftar, type Pendaftar } from "./pendaftar";
import { HARI_SLOT_KEMBALI, KANTOR } from "./kantor";
import { getKuotaMap } from "./pengaturan";
import { hariIni, tambahHari } from "./tanggal";

export type Peserta = Pendaftar & { tanggalMulai: string; tanggalSelesai: string };

// Peserta yang belum selesai magang, diurutkan tanggal keluar paling cepat di atas
export async function listPeserta(): Promise<Peserta[]> {
  const today = hariIni();
  return (await listPendaftar())
    .filter((p): p is Peserta => !!p.tanggalMulai && !!p.tanggalSelesai && p.tanggalSelesai >= today)
    .sort((a, b) => a.tanggalSelesai.localeCompare(b.tanggalSelesai) || a.nama.localeCompare(b.nama));
}

export async function hitungKuota() {
  const [peserta, kuotaMap] = await Promise.all([listPeserta(), getKuotaMap()]);

  // Peserta yang keluar dalam <= 14 hari (H-2 minggu) tidak lagi menghabiskan slot
  const batas = tambahHari(hariIni(), HARI_SLOT_KEMBALI);

  return KANTOR.map((kantor) => {
    const di = peserta.filter((p) => p.kantor === kantor.id);
    const terisi = di.filter((p) => p.tanggalSelesai > batas).length;
    const max = kuotaMap[kantor.id];
    return {
      kantor,
      terisi,
      max,
      sisa: Math.max(0, max - terisi),
      penuh: terisi >= max,
      segeraKeluar: di.length - terisi, // peserta yang slotnya sudah dilepas
    };
  });
}