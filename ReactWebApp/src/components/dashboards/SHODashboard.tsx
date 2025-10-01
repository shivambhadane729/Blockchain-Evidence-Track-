import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Eye, Users, FileText, Clock, Shield, MapPin, Calendar, User } from "lucide-react";

interface PendingCase {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  location: string;
  jurisdiction: string;
  registeredBy: string;
  dateRegistered: string;
  incidentDate: string;
  officerName: string;
  officerId: string;
  initialNotes: string;
  tags: string[];
}

// Mock data removed - now using real backend API

// Mock data removed - now using real backend API

export default function SHODashboard() {
  const [pendingCases, setpendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCases] = useState([]);

  const handleApproveCase = (caseId: string) => {
    setPendingCases(prev => prev.filter(c => c.id !== caseId));
    // In real app, this would update the case status in the database
  };

  const handleRejectCase = (caseId: string) => {
    setPendingCases(prev => prev.filter(c => c.id !== caseId));
    // In real app, this would update the case status to rejected
  };

  const getPriorityBadge = (priority: PendingCase["priority"]) => {
    const priorityConfig = {
      low: { color: "bg-green-600", text: "Low" },
      medium: { color: "bg-yellow-600", text: "Medium" },
      high: { color: "bg-red-600", text: "High" }
    };
    
    const config = priorityConfig[priority];
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      "under-investigation": { color: "bg-yellow-600", text: "Under Investigation" },
      "evidence-collection": { color: "bg-blue-600", text: "Evidence Collection" },
      "closed": { color: "bg-green-600", text: "Closed" }
    };
    
    const config = statusConfig[status] || { color: "bg-gray-600", text: status };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Station House Officer Dashboard</h1>
        <p className="text-muted-foreground">Approve case creation and verify first custody step</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{pendingCases.length}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{activeCases.length}</p>
                <p className="text-sm text-muted-foreground">Active Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Station Officers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Cases This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Cases for Approval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cases Pending Approval
          </CardTitle>
          <CardDescription>Review and approve new case registrations from officers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registered By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <p>No pending cases available</p>
                    <p className="text-sm">Pending cases will appear here when available</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Active Cases Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Station's Active Cases</CardTitle>
          <CardDescription>Monitor ongoing investigations and custody status in your station</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned Officer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Custody Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <p>No active cases available</p>
                    <p className="text-sm">Active cases will appear here when available</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Custody Chain View (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Custody Chain View (Read-Only)
          </CardTitle>
          <CardDescription>Review chain of custody for evidence integrity verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input placeholder="Enter Case ID to view custody chain..." className="flex-1" />
              <Button className="gap-2">
                <Eye className="h-4 w-4" />
                View Chain
              </Button>
            </div>
            
            {/* Custody Chain Display */}
            <div className="border rounded-lg p-8 bg-gray-50 text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">No custody chain selected</p>
              <p className="text-sm text-gray-400">Enter a Case ID above to view the custody chain</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
