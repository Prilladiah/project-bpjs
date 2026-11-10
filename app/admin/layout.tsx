import AdminNav from "@/components/adminnav";
import DashboardStats from "@/components/dashboardstats";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      <DashboardStats />
      {children}
    </>
  );
}