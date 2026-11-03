"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Kelola konten" },
  { href: "/admin/pendaftar", label: "Data pendaftar" },
  { href: "/admin/magang", label: "Peserta magang" },
  { href: "/admin/kuota", label: "Kuota" },
  { href: "/admin/password", label: "Ubah password" }, // sesuaikan dengan route Anda
];

export default function AdminTabs() {
  const path = usePathname();
  return (
    <nav className="flex justify-center gap-1 overflow-x-auto border-b border-edge bg-white px-4">
      {TABS.map((t) => {
        const aktif = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition ${
              aktif ? "border-sea text-sea" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}