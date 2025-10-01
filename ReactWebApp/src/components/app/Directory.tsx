import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Eye } from "lucide-react";

interface EvidenceItem {
  id: string;
  title: string;
  type: "image" | "video" | "log" | "document";
  status: "sealed" | "in-analysis" | "released" | "flagged";
  role: "Investigator" | "Lab" | "Court";
  hash: string;
}

const DATA: EvidenceItem[] = [
  { id: "EV-001", title: "Bodycam_07-12.mp4", type: "video", status: "sealed", role: "Investigator", hash: "91e3a...f52" },
  { id: "EV-002", title: "CrimeScene_A.jpg", type: "image", status: "in-analysis", role: "Lab", hash: "8b21c...af0" },
  { id: "EV-003", title: "PhoneDump.log", type: "log", status: "flagged", role: "Lab", hash: "c733d...9dd" },
  { id: "EV-004", title: "Court_Order_17.pdf", type: "document", status: "released", role: "Court", hash: "a1012...7b9" },
];

const statusStyles: Record<EvidenceItem["status"], string> = {
  sealed: "bg-green-600 text-white",
  "in-analysis": "bg-blue-600 text-white",
  released: "bg-slate-700 text-white",
  flagged: "bg-red-600 text-white animate-pulse",
};

export default function Directory() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return DATA.filter((d) =>
      [d.id, d.title, d.type, d.status, d.role, d.hash].some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [q]);

  return (
    <Card id="directory" className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">Evidence Directory</CardTitle>
        <CardDescription>Search and filter authorized evidence records.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, title, type, role, status, or hash" className="pl-9" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.id}</TableCell>
                  <TableCell>{d.title}</TableCell>
                  <TableCell className="capitalize">{d.type}</TableCell>
                  <TableCell><Badge className={statusStyles[d.status]}>{d.status}</Badge></TableCell>
                  <TableCell>{d.role}</TableCell>
                  <TableCell className="font-mono text-xs">{d.hash}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2"><Eye className="h-4 w-4" /> View</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{d.id} • {d.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{d.type}</span></div>
                          <div><span className="text-muted-foreground">Hash:</span> <span className="font-mono">{d.hash}</span></div>
                          <div><span className="text-muted-foreground">Authorized Role:</span> {d.role}</div>
                        </div>
                        <div className="mt-4 rounded-lg border p-4">
                          <p className="text-sm font-medium mb-2">Chain-of-Custody Preview</p>
                          <ul className="space-y-3 text-sm">
                            <li>• Uploaded by Investigator • Anchored on-chain</li>
                            <li>• Access granted to Lab via smart contract</li>
                            <li>• Audit trail generated for court submission</li>
                          </ul>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
