export type Jenis = "cabang" | "kcp";
export type Kantor = { id: string; nama: string; jenis: Jenis };

// Kuota bawaan (bisa diubah admin di /admin/kuota)
export const KUOTA: Record<Jenis, number> = { cabang: 25, kcp: 8 };

// Slot kembali kosong jika peserta keluar dalam <= 14 hari (H-2 minggu)
export const HARI_SLOT_KEMBALI = 14;
// Peringatan admin jika peserta berakhir dalam <= 21 hari (H-3 minggu)
export const HARI_PERINGATAN = 21;

// Khusus area Jogja. "id" harus unik dan jangan diubah setelah ada data.
export const KANTOR: Kantor[] = [
  { id: "cab-yogyakarta", nama: "Cabang Yogyakarta", jenis: "cabang" },
  { id: "kcp-sleman", nama: "KCP Sleman", jenis: "kcp" },
  { id: "kcp-bantul", nama: "KCP Bantul", jenis: "kcp" },
  { id: "kcp-wates", nama: "KCP Wates", jenis: "kcp" },
  { id: "kcp-wonosari", nama: "KCP Wonosari", jenis: "kcp" },
];

export const getKantor = (id: string) => KANTOR.find((k) => k.id === id);