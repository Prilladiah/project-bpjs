import Link from "next/link";
import { ringkasan } from "@/lib/kuota";

export default async function DashboardStats() {
  let r;
  try {
    r = await ringkasan();
  } catch {
    return null;
  }
  const items = [
    { label: "Yang mendaftar", nilai: r.mendaftar, href: "/admin/pendaftar", warna: "text-ink" },
    { label: "Peserta diterima", nilai: r.diterima, href: "/admin/pendaftar", warna: "text-sea" },
    { label: "Peserta magang", nilai: r.magang, href: "/admin/magang", warna: "text-green-700" },
    { label: "Peserta akan keluar", nilai: r.akanKeluar, href: "/admin/magang", warna: "text-amber-600" },
  ];
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-5 pt-6 lg:grid-cols-4">
      {items.map((i) => (
        <Link key={i.label} href={i.href} className="card p-4 transition hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{i.label}</p>
          <p className={`mt-1 text-3xl font-extrabold ${i.warna}`}>{i.nilai}</p>
        </Link>
      ))}
    </div>
  );
}