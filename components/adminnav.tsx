"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Kelola konten" },
  { href: "/admin/pendaftar", label: "Data pendaftar" },
  { href: "/admin/password", label: "Ubah password" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="border-b border-edge bg-white" aria-label="Menu admin">
      <div className="mx-auto flex max-w-6xl justify-start gap-1 overflow-x-auto px-2 sm:justify-center sm:px-5">
        {tabs.map((t) => {
          const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3.5 text-[13px] font-semibold transition sm:px-4 sm:text-sm ${
                active ? "border-sea text-sea" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}