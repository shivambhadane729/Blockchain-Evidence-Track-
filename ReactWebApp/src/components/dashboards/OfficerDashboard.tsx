import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, MapPin, Calendar, User, ArrowLeft, QrCode, CheckCircle, Eye } from "lucide-react";
import APIService from "@/services/api";

interface Case {
  id: string;
  caseId: string;
  title: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  createdAt: string;
  evidenceCount: number;
  blockchainHash: string;
}

interface NewCaseForm {
  caseId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  incidentDate: string;
  location: string;
  jurisdiction: string;
  initialNotes: string;
  tags: string;
}

// Mock data removed - now using real backend API

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCase, setNewCase] = useState<NewCaseForm>({
    caseId: "",
    title: "",
    description: "",
    category: "",
    priority: "",
    incidentDate: "",
    location: "",
    jurisdiction: "",
    initialNotes: "",
    tags: ""
  });
  const [cases, setCases] = useState<Case[]>([]);
  const [generatedCaseId, setGeneratedCaseId] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const casesData = await APIService.getCases();
      setCases(casesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const generateCaseId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CASE-${year}-${randomNum}`;
  };

  const handleSubmitCase = async () => {
    if (newCase.title && newCase.description && newCase.category && newCase.priority && newCase.incidentDate && newCase.location && newCase.jurisdiction) {
      try {
        const caseData = {
          title: newCase.title,
          description: newCase.description,
          category: newCase.category,
          priority: newCase.priority,
          incidentDate: newCase.incidentDate,
          location: newCase.location,
          jurisdiction: newCase.jurisdiction,
          initialNotes: newCase.initialNotes || '',
          tags: newCase.tags || ''
        };
        
        const createdCase = await APIService.createCase(caseData);
        setGeneratedCaseId(createdCase.caseId);
        setCases(prev => [createdCase, ...prev]);
        setShowNewCaseForm(false);
        setShowConfirmation(true);
        setError(''); // Clear any previous errors
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create case');
      }
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleResetForm = () => {
    setNewCase({
      caseId: "",
      title: "",
      description: "",
      category: "",
      priority: "",
      incidentDate: "",
      location: "",
      jurisdiction: "",
      initialNotes: "",
      tags: ""
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && cases.length > 0) {
      try {
        const firstCase = cases[0];
        const result = await APIService.uploadEvidence(file, firstCase.caseId, 'Evidence file');
        console.log('File uploaded successfully:', result);
        // Refresh cases to update evidence count
        const updatedCases = await APIService.getCases();
        setCases(updatedCases);
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }
  };

  const handleBackToDashboard = () => {
    setShowNewCaseForm(false);
    setShowConfirmation(false);
    setGeneratedCaseId("");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      'Open': { color: "bg-blue-600", text: "Open" },
      'Under Investigation': { color: "bg-yellow-600", text: "Under Investigation" },
      'Closed': { color: "bg-green-600", text: "Closed" }
    };
    
    const config = statusConfig[status] || { color: "bg-gray-600", text: status };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  // Show confirmation screen
  if (showConfirmation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToDashboard} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Case Registration Successful</h1>
            <p className="text-muted-foreground">Your case has been registered and is ready for processing</p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Case Registered Successfully</CardTitle>
            <CardDescription>Your case has been submitted and assigned a unique identifier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Case ID</p>
              <p className="text-2xl font-bold font-mono">{generatedCaseId}</p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">QR Code for Evidence Linking</p>
              <p className="text-sm text-gray-400">Use this QR code to link evidence to this case</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="font-medium">Case Title</p>
                <p className="text-muted-foreground">{newCase.title}</p>
              </div>
              <div>
                <p className="font-medium">Priority</p>
                <p className="text-muted-foreground">{newCase.priority}</p>
              </div>
              <div>
                <p className="font-medium">Category</p>
                <p className="text-muted-foreground">{newCase.category}</p>
              </div>
              <div>
                <p className="font-medium">Incident Date</p>
                <p className="text-muted-foreground">{new Date(newCase.incidentDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleBackToDashboard} className="flex-1">
                Back to Dashboard
              </Button>
              <Button variant="outline" className="flex-1">
                Print Case Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show registration form
  if (showNewCaseForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToDashboard} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Register New Case</h1>
            <p className="text-muted-foreground">Fill in the case details to register a new case</p>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Register New Case
            </CardTitle>
            <CardDescription>Complete all required fields to register a new case</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Case Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Case Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Case Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., ATM Robbery – Sector 17"
                    value={newCase.title}
                    onChange={(e) => setNewCase(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category/Crime Type *</Label>
                  <Select value={newCase.category} onValueChange={(value) => setNewCase(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Theft">Theft</SelectItem>
                      <SelectItem value="Fraud">Fraud</SelectItem>
                      <SelectItem value="Cybercrime">Cybercrime</SelectItem>
                      <SelectItem value="Assault">Assault</SelectItem>
                      <SelectItem value="Traffic Violation">Traffic Violation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level *</Label>
                  <Select value={newCase.priority} onValueChange={(value) => setNewCase(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">Incident Date & Time *</Label>
                  <Input
                    id="incidentDate"
                    type="datetime-local"
                    value={newCase.incidentDate}
                    onChange={(e) => setNewCase(prev => ({ ...prev, incidentDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Case Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the incident..."
                  rows={4}
                  value={newCase.description}
                  onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Incident Location *</Label>
                  <Input
                    id="location"
                    placeholder="Address or GPS location..."
                    value={newCase.location}
                    onChange={(e) => setNewCase(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction/Station *</Label>
                  <Select value={newCase.jurisdiction} onValueChange={(value) => setNewCase(prev => ({ ...prev, jurisdiction: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Delhi Police Station">Delhi Police Station</SelectItem>
                      <SelectItem value="Delhi Traffic Police">Delhi Traffic Police</SelectItem>
                      <SelectItem value="Cyber Crime Cell">Cyber Crime Cell</SelectItem>
                      <SelectItem value="Special Branch">Special Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Officer Details (Auto-filled) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Officer Details (Auto-filled)</h3>
              <div className="grid gap-4 md:grid-cols-3 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Officer Name</Label>
                  <Input value="Rajiv Sharma" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Officer ID / Badge</Label>
                  <Input value="DP-2024-001234" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Contact Info</Label>
                  <Input value="rajiv.sharma@delhipolice.gov" disabled />
                </div>
              </div>
            </div>

            {/* Optional Evidence Reference */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Optional Evidence Reference</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="initialNotes">Initial Notes / Leads</Label>
                  <Textarea
                    id="initialNotes"
                    placeholder="e.g., Surveillance footage at nearby store, witness statements collected..."
                    rows={3}
                    value={newCase.initialNotes}
                    onChange={(e) => setNewCase(prev => ({ ...prev, initialNotes: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags/Keywords</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., atm, robbery, sector-17 (comma separated)"
                    value={newCase.tags}
                    onChange={(e) => setNewCase(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSubmitCase} className="flex-1 gap-2">
                <CheckCircle className="h-4 w-4" />
                Generate Case ID & Submit
              </Button>
              <Button variant="outline" onClick={handleResetForm} className="flex-1">
                Reset Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Officer Dashboard</h1>
          <p className="text-muted-foreground">Register and manage your cases</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewCaseForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Register New Case
          </Button>
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3,.zip"
          />
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()} className="gap-2">
            <FileText className="h-4 w-4" />
            Upload Evidence
          </Button>
        </div>
      </div>

      {/* Cases Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Registered Cases</CardTitle>
          <CardDescription>View and track the status of your cases</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading cases...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Error: {error}</p>
              <Button variant="outline" onClick={loadCases} className="mt-2">
                Retry
              </Button>
            </div>
          ) : !Array.isArray(cases) || cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cases registered yet</p>
              <p className="text-sm">Click "Register New Case" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Upload Evidence</TableHead>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(cases) && cases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            APIService.uploadEvidence(file, caseItem.caseId, 'Evidence file').then(() => {
                              loadCases(); // Refresh cases
                            });
                          }
                        }}
                        className="hidden"
                        id={`file-upload-${caseItem.id}`}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3,.zip"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById(`file-upload-${caseItem.id}`)?.click()}
                        className="gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Upload
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{caseItem.caseId}</TableCell>
                    <TableCell>{caseItem.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{caseItem.description}</TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(caseItem.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/case/${caseItem.caseId}`)}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{Array.isArray(cases) ? cases.length : 0}</p>
                <p className="text-sm text-muted-foreground">Total Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{Array.isArray(cases) ? cases.filter(c => c.status === "Open").length : 0}</p>
                <p className="text-sm text-muted-foreground">Active Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{Array.isArray(cases) ? cases.filter(c => c.status === "closed").length : 0}</p>
                <p className="text-sm text-muted-foreground">Closed Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
