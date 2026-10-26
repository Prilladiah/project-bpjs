import AdminNav from "@/components/adminnav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (<><AdminNav />{children}</>);
}