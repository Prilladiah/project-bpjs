"use client";
import { useEffect, useRef, useState } from "react";
import { KANTOR } from "@/lib/kantor";

type Kuota = Record<string, { terisi: number; max: number; penuh: boolean }>;

export default function KantorSelect({
  value,
  kuota,
  onPick,
}: {
  value: string;
  kuota: Kuota;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const terpilih = KANTOR.find((k) => k.id === value);

  useEffect(() => {
    const klik = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", klik); document.removeEventListener("keydown", esc); };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="field mt-1.5 flex w-full items-center justify-between gap-2 text-left font-normal"
      >
        <span className={terpilih ? "" : "text-muted"}>{terpilih?.nama ?? "Pilih kantor…"}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-edge bg-white py-1 shadow-xl"
        >
          {(["cabang", "kcp"] as const).map((j) => (
            <li key={j} role="presentation">
              <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-muted">
                {j === "cabang" ? "Kantor Cabang" : "Kantor Cabang Perintis (KCP)"}
              </p>
              <ul>
                {KANTOR.filter((k) => k.jenis === j).map((k) => {
                  const penuh = !!kuota[k.id]?.penuh;
                  return (
                    <li
                      key={k.id}
                      role="option"
                      aria-selected={value === k.id}
                      aria-disabled={penuh}
                      onClick={() => { setOpen(false); onPick(k.id); }}
                      className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm ${
                        penuh ? "bg-gray-50 text-gray-400" : value === k.id ? "bg-paper font-semibold" : "hover:bg-paper"
                      }`}
                    >
                      <span className={penuh ? "line-through" : ""}>{k.nama}</span>
                      {penuh && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">Penuh</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}