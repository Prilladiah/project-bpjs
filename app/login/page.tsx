import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Login admin" };

export default function Login() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-[#DDF3D6] to-paper px-5">
      <Link
        href="/"
        aria-label="Kembali ke beranda"
        className="absolute left-8 top-8 flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-white/80 text-ink shadow-card backdrop-blur transition hover:bg-white hover:text-sea md:left-16 md:top-12"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </Link>
      <LoginForm />
    </main>
  );
}