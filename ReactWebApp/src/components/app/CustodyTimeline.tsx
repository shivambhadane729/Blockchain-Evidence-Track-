import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Gavel, Microscope, ShieldCheck, UserCheck } from "lucide-react";

interface EventItem {
  at: string;
  actor: string;
  role: "Investigator" | "Lab" | "Court";
  action: string;
  tx?: string;
}

const demo: EventItem[] = [
  { at: "2025-08-12 09:24", actor: "Det. Salazar", role: "Investigator", action: "Uploaded evidence and generated hash", tx: "0x91e3a...f52" },
  { at: "2025-08-12 10:02", actor: "Forensics Lab A", role: "Lab", action: "Access granted via smart contract" },
  { at: "2025-08-12 16:40", actor: "Forensics Lab A", role: "Lab", action: "Analysis result attached" },
  { at: "2025-08-15 11:05", actor: "District Court #7", role: "Court", action: "Evidence viewed in session" },
  { at: "2025-08-20 08:13", actor: "ChainGuard", role: "Investigator", action: "Automated audit report generated", tx: "0xa7b...39c" },
];

const RoleIcon: Record<EventItem["role"], JSX.Element> = {
  Investigator: <ShieldCheck className="h-4 w-4 text-primary" />,
  Lab: <Microscope className="h-4 w-4 text-accent" />,
  Court: <Gavel className="h-4 w-4 text-foreground" />,
};

export default function CustodyTimeline() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">Chain of Custody</CardTitle>
        <CardDescription>Every access, transfer, and action is immutably recorded.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <ul className="space-y-6">
            {demo.map((e, i) => (
              <li key={i} className="relative pl-10">
                <span className="absolute left-2 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-background ring-2 ring-border">
                  {RoleIcon[e.role]}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{e.role}</Badge>
                  <span className="text-sm text-muted-foreground">{e.at}</span>
                  {e.tx && <Badge className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900">{e.tx}</Badge>}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{e.actor}</span>
                </div>
                <p className="mt-1 text-foreground">{e.action}</p>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
