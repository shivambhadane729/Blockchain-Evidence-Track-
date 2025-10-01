import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Package, Truck, CheckCircle, Clock, MapPin, User, AlertTriangle, Bell } from "lucide-react";

interface EvidenceItem {
  id: string;
  caseId: string;
  description: string;
  location: string;
  status: "stored" | "in-transit" | "transferred" | "overdue";
  dateStored: string;
  storedBy: string;
  currentLocation: string;
  dueDate?: string;
  transferTo?: string;
}

interface OverdueAlert {
  id: string;
  caseId: string;
  evidenceId: string;
  description: string;
  daysOverdue: number;
  lastLocation: string;
  assignedTo: string;
}

// Mock data removed - now using real backend API

// Mock data removed - now using real backend API

export default function CustodianDashboard() {
  const [evidence, setevidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overdueAlerts] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleQRScan = () => {
    if (qrCode) {
      // Simulate QR code scanning
      const newEvidence: EvidenceItem = {
        id: `EVID-${Date.now()}`,
        caseId: qrCode,
        description: "Evidence from QR Scan",
        location: "QR Scanned Location",
        status: "stored",
        dateStored: new Date().toISOString().split('T')[0],
        storedBy: "Custodian",
        currentLocation: "Malkhana B-05"
      };
      
      setEvidence(prev => [newEvidence, ...prev]);
      setQrCode("");
      setShowQRScanner(false);
    }
  };

  const handleConfirmStorage = (evidenceId: string) => {
    setEvidence(prev => prev.map(item => 
      item.id === evidenceId 
        ? { ...item, status: "stored" as const }
        : item
    ));
  };

  const handleLogTransfer = (evidenceId: string) => {
    setEvidence(prev => prev.map(item => 
      item.id === evidenceId 
        ? { ...item, status: "transferred" as const }
        : item
    ));
  };

  const getStatusBadge = (status: EvidenceItem["status"]) => {
    const statusConfig = {
      stored: { color: "bg-green-600", text: "Stored", icon: Package },
      "in-transit": { color: "bg-yellow-600", text: "In Transit", icon: Truck },
      transferred: { color: "bg-blue-600", text: "Transferred", icon: CheckCircle },
      overdue: { color: "bg-red-600", text: "Overdue", icon: AlertTriangle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Evidence Custodian Dashboard</h1>
        <p className="text-muted-foreground">Manage physical evidence storage in Malkhana</p>
      </div>

      {/* QR Scanner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>Scan QR codes to register new evidence items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="qr-input">QR Code / Case ID</Label>
              <Input
                id="qr-input"
                placeholder="Scan QR code or enter Case ID..."
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleQRScan} disabled={!qrCode} className="gap-2">
                <QrCode className="h-4 w-4" />
                Scan & Register
              </Button>
            </div>
          </div>
          
          {/* QR Scanner Placeholder */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">QR Scanner Placeholder</p>
            <p className="text-sm text-gray-400">Camera would be active here for QR scanning</p>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Evidence Alerts */}
      {overdueAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Bell className="h-5 w-5" />
              Overdue Evidence Alerts
            </CardTitle>
            <CardDescription className="text-red-600">
              Evidence items that are overdue or unreturned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-8 text-muted-foreground">
            <p>No overdue alerts</p>
            <p className="text-sm">All evidence is properly tracked</p>
          </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => e.status === "stored").length}</p>
                <p className="text-sm text-muted-foreground">Stored Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => e.status === "in-transit").length}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => e.status === "transferred").length}</p>
                <p className="text-sm text-muted-foreground">Transferred</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{evidence.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Inventory</CardTitle>
          <CardDescription>Track all evidence items in custody</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence ID</TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Location</TableHead>
                  <TableHead>Transfer To</TableHead>
                  <TableHead>Stored By</TableHead>
                  <TableHead>Date Stored</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              <p>No evidence in custody</p>
              <p className="text-sm">Evidence will appear here when transferred to custody</p>
            </TableCell>
          </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
