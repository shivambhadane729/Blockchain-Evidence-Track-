import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoleAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role-Based Access</CardTitle>
        <CardDescription>Least-privilege access for Investigators, Forensic Labs, and Courts.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border bg-white p-4">
          <p className="font-semibold">Investigator</p>
          <p className="text-sm text-muted-foreground mt-1">Register evidence, request analysis, share to court with approvals.</p>
        </div>
        <div className="rounded-md border bg-white p-4">
          <p className="font-semibold">Forensic Lab</p>
          <p className="text-sm text-muted-foreground mt-1">Access upon approval, attach analysis artifacts, update status.</p>
        </div>
        <div className="rounded-md border bg-white p-4">
          <p className="font-semibold">Court</p>
          <p className="text-sm text-muted-foreground mt-1">Read-only viewing, verify hash and custody, download audit trail.</p>
        </div>
      </CardContent>
    </Card>
  );
}
