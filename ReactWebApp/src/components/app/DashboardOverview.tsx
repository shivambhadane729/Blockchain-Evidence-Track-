import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Item = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
    <div className="text-2xl font-bold text-primary">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

export default function DashboardOverview() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Case Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Item label="Open Cases" value="128" />
          <Item label="Evidence Items" value="3,042" />
          <Item label="Pending Approvals" value="17" />
          <Item label="Tamper Flags" value="2" />
        </div>
      </CardContent>
    </Card>
  );
}
