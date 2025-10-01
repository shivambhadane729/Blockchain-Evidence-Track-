import RoleGuard from "@/components/app/RoleGuard";
import JudgeDashboard from "@/components/dashboards/JudgeDashboard";

export default function JudgeDashboardPage() {
  return (
    <RoleGuard allowedRoles={['judge-magistrate']}>
      <JudgeDashboard />
    </RoleGuard>
  );
}
