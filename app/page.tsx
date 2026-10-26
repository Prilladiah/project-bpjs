import Navbar from "@/components/Navbar";
import { Hero, Program, VisiMisi, Informasi, Kontak, Alamat, Magang } from "@/components/Sections";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function Home() {
  const c = await getContent();
  return (
    <>
      <Navbar />
      <main>
        <Hero c={c} /><Program c={c} /><VisiMisi c={c} /><Informasi c={c} /><Kontak c={c} /><Alamat c={c} /><Magang c={c} />
      </main>
      <footer className="mt-24 border-t border-edge bg-white py-6 text-center text-sm text-muted">{c.footer}</footer>
    </>
  );
}
