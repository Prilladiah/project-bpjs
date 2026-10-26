import AdminEditor from "@/components/AdminEditor";
import { getContent } from "@/lib/content";
export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";
export default async function Admin() { return <AdminEditor initial={await getContent()} />; }
