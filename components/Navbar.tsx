"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";

const links = [["Program", "#program"], ["Visi & Misi", "#visi-misi"], ["Informasi", "#informasi"], ["Kontak", "#kontak"], ["Alamat", "#alamat"], ["Magang", "#magang"]];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [shadow, setShadow] = useState(false);
  useEffect(() => {
    const f = () => setShadow(window.scrollY > 8);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`sticky top-0 z-50 bg-white/85 backdrop-blur-md transition-shadow ${shadow ? "shadow-card" : ""}`}>
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5" aria-label="Utama">
        <Link href="/"><Logo /></Link>
        <ul className="hidden items-center gap-8 lg:flex">
          {links.map(([l, h]) => <li key={h}><a href={h} className="text-sm font-medium text-muted transition hover:text-sea">{l}</a></li>)}
          <li><Link href="/login" className="btn btn-primary !py-2">Login</Link></li>
        </ul>
        <button className="p-2 lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="mb-1.5 block h-0.5 w-6 bg-ink" /><span className="mb-1.5 block h-0.5 w-6 bg-ink" /><span className="block h-0.5 w-6 bg-ink" />
        </button>
      </nav>
      {open && (
        <ul className="border-t border-edge bg-white px-5 py-3 lg:hidden">
          {links.map(([l, h]) => <li key={h}><a href={h} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium">{l}</a></li>)}
          <li><Link href="/login" className="block py-2.5 text-sm font-semibold text-sea">Login</Link></li>
        </ul>
      )}
    </header>
  );
}
