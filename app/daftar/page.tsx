import Link from "next/link";
import DaftarForm from "@/components/daftarform";

export const metadata = { title: "Form Pendaftaran Magang" };

export default function Daftar() {
  return (
    <main className="min-h-dvh bg-gradient-to-br from-[#9BD38A] via-[#8DBBD8] to-[#C4F4D8] px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Link
          href="/"
          aria-label="Kembali ke beranda"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/70 text-ink backdrop-blur transition hover:bg-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <DaftarForm />
      </div>
    </main>
  );
}