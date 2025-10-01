import RoleGuard from "@/components/app/RoleGuard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={['system-admin']}>
      <AdminDashboard />
    </RoleGuard>
  );
}
