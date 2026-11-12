export const MIN_BULAN = 2;
export const MAX_BULAN = 24;

const DAY = 86_400_000;

export function parseIso(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

export function tambahBulan(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, d)).toISOString().slice(0, 10);
}

export function selisihBulan(mulai: string, selesai: string): number {
  const a = parseIso(mulai), b = parseIso(selesai);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / (DAY * 30.44));
}

// Tanggal hari ini (zona WIB) format yyyy-mm-dd
export function hariIni(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function tambahHari(iso: string, n: number): string {
  const d = parseIso(iso);
  return d ? new Date(d.getTime() + n * DAY).toISOString().slice(0, 10) : iso;
}

// Selisih hari dari a ke b (positif jika b setelah a)
export function selisihHari(a: string, b: string): number {
  const x = parseIso(a), y = parseIso(b);
  return x && y ? Math.round((y.getTime() - x.getTime()) / DAY) : 0;
}