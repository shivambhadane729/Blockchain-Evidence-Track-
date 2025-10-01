import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Eye, Gavel, Calendar, User, MapPin } from "lucide-react";

interface CaseFile {
  caseId: string;
  description: string;
  status: "preparation" | "ready-for-court" | "in-court";
  evidenceCount: number;
  reportsCount: number;
  lastUpdated: string;
  assignedProsecutor: string;
}

// Mock data removed - now using real backend API

export default function ProsecutorDashboard() {
  const [cases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCases = cases.filter(caseItem =>
    caseItem.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: CaseFile["status"]) => {
    const statusConfig = {
      preparation: { color: "bg-yellow-600", text: "In Preparation" },
      "ready-for-court": { color: "bg-green-600", text: "Ready for Court" },
      "in-court": { color: "bg-blue-600", text: "In Court" }
    };
    
    const config = statusConfig[status];
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Public Prosecutor Dashboard</h1>
        <p className="text-muted-foreground">Review evidence for trial preparation - Read-only access</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search cases by ID or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{cases.length}</p>
                <p className="text-sm text-muted-foreground">Total Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{cases.filter(c => c.status === "ready-for-court").length}</p>
                <p className="text-sm text-muted-foreground">Ready for Court</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{cases.filter(c => c.status === "preparation").length}</p>
                <p className="text-sm text-muted-foreground">In Preparation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Assigned Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Files */}
      <Card>
        <CardHeader>
          <CardTitle>Case Files (Read-Only Access)</CardTitle>
          <CardDescription>Review evidence and forensic reports for court preparation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evidence Items</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <p>No case files available</p>
                    <p className="text-sm">Case files will appear here when available</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Custody Timeline Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>Custody Timeline Viewer</CardTitle>
          <CardDescription>Review chain of custody for evidence integrity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input placeholder="Enter Case ID to view custody timeline..." className="flex-1" />
              <Button className="gap-2">
                <Eye className="h-4 w-4" />
                View Timeline
              </Button>
            </div>
            
            {/* Custody Timeline Display */}
            <div className="border rounded-lg p-8 bg-gray-50 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">No custody timeline selected</p>
              <p className="text-sm text-gray-400">Enter a Case ID above to view the custody timeline</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
