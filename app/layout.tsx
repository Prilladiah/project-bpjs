import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = {
  title: "Magang BPJS Ketenagakerjaan Yogyakarta",
  description: "Informasi dan pendaftaran magang di BPJS Ketenagakerjaan Kantor Cabang Yogyakarta.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id" className={sans.variable}><body>{children}</body></html>;
}
