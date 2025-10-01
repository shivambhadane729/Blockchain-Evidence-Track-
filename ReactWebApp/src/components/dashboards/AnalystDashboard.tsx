import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, CheckCircle, AlertTriangle, Hash, FileCheck, Microscope, Eye, Download, Clock, User, Calendar, MapPin, Phone, Mail, Search, Filter, Plus, Edit, Trash2, Play, Pause, Square, ExternalLink, RefreshCw, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import APIService from "@/services/api";

interface EvidenceItem {
  id: string;
  evidenceId: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  blockchainHash: string;
  hashVerified: boolean;
  analysisStatus: "pending" | "in-progress" | "completed";
  reportUploaded: boolean;
  reportFile?: string;
}

interface CaseItem {
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

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "case_created" | "evidence_uploaded" | "analysis_started" | "analysis_completed" | "report_generated" | "verification_completed";
  title: string;
  description: string;
  user: string;
  caseId: string;
  evidenceId?: string;
}

interface InvestigationNote {
  id: string;
  caseId: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
  type: "observation" | "finding" | "hypothesis" | "conclusion";
}

// Mock data removed - now using real backend API

export default function AnalystDashboard() {
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [investigationNotes, setInvestigationNotes] = useState<InvestigationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvestigationPanel, setShowInvestigationPanel] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'observation' as const });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all cases
      const casesData = await APIService.getCases();
      setCases(casesData);
      
      // Get evidence for each case
      const allEvidence: EvidenceItem[] = [];
      const allTimelineEvents: TimelineEvent[] = [];
      
      for (const caseItem of casesData) {
        // Add case creation to timeline
        allTimelineEvents.push({
          id: `case-${caseItem.id}`,
          timestamp: caseItem.createdAt,
          type: "case_created",
          title: "Case Created",
          description: `Case ${caseItem.caseId} was created: ${caseItem.title}`,
          user: "System",
          caseId: caseItem.caseId
        });

        try {
          const caseEvidence = await APIService.getEvidenceByCaseId(caseItem.caseId);
          // Transform evidence to match our interface
          const transformedEvidence = caseEvidence.map((item: any) => ({
            id: item.id,
            evidenceId: item.evidenceId,
            caseId: item.caseId,
            fileName: item.fileName,
            fileSize: item.fileSize,
            uploadedAt: item.uploadedAt,
            blockchainHash: item.blockchainHash,
            hashVerified: false, // Default to false, can be verified
            analysisStatus: "pending" as const,
            reportUploaded: false
          }));
          allEvidence.push(...transformedEvidence);

          // Add evidence upload events to timeline
          caseEvidence.forEach((item: any) => {
            allTimelineEvents.push({
              id: `evidence-${item.id}`,
              timestamp: item.uploadedAt,
              type: "evidence_uploaded",
              title: "Evidence Uploaded",
              description: `Evidence ${item.evidenceId} uploaded: ${item.fileName}`,
              user: "Field Officer",
              caseId: caseItem.caseId,
              evidenceId: item.evidenceId
            });
          });
        } catch (err) {
          console.log(`No evidence found for case ${caseItem.caseId}`);
        }
      }
      
      // Sort timeline by timestamp
      allTimelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setEvidence(allEvidence);
      setTimeline(allTimelineEvents);
      
      // Generate mock investigation notes
      const mockNotes: InvestigationNote[] = [
        {
          id: '1',
          caseId: casesData[0]?.caseId || '',
          title: 'Initial Evidence Review',
          content: 'Initial review of uploaded evidence files. Banking transaction logs show suspicious activity patterns.',
          createdAt: new Date().toISOString(),
          createdBy: 'Forensic Analyst',
          type: 'observation'
        },
        {
          id: '2',
          caseId: casesData[0]?.caseId || '',
          title: 'Hash Verification Complete',
          content: 'All evidence files have been verified for integrity. Blockchain hashes are valid.',
          createdAt: new Date().toISOString(),
          createdBy: 'Forensic Analyst',
          type: 'finding'
        }
      ];
      setInvestigationNotes(mockNotes);
      
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHashVerification = async (evidenceId: string) => {
    try {
      // Find the evidence item to get the evidenceId
      const evidenceItem = evidence.find(item => item.id === evidenceId);
      if (!evidenceItem) return;

      // Use the API to verify the evidence
      const result = await APIService.verifyEvidence(evidenceItem.evidenceId);
      
      if (result.verified) {
        // Update the evidence state
        setEvidence(prev => prev.map(item => 
          item.id === evidenceId 
            ? { ...item, hashVerified: true, analysisStatus: "in-progress" as const }
            : item
        ));
        
        alert(`✅ HASH VERIFIED\n\nEvidence ID: ${evidenceItem.evidenceId}\nFile: ${evidenceItem.fileName}\nBlockchain Hash: ${evidenceItem.blockchainHash}\n\nHash verification successful! Evidence is authentic.`);
      } else {
        alert(`❌ HASH VERIFICATION FAILED\n\nEvidence ID: ${evidenceItem.evidenceId}\nFile: ${evidenceItem.fileName}\n\nHash verification failed. Please investigate further.`);
      }
    } catch (err) {
      alert('❌ VERIFICATION ERROR\n\nFailed to verify evidence hash. Please try again.');
      console.error('Hash verification error:', err);
    }
  };


  const handleSignCustodyTransfer = (evidenceId: string) => {
    // Simulate signing custody transfer
    console.log(`Signing custody transfer for evidence ${evidenceId}`);
  };

  const getHashStatusBadge = (verified: boolean) => {
    return verified ? (
      <Badge className="bg-green-600 text-white gap-1">
        <CheckCircle className="h-3 w-3" />
        Verified
      </Badge>
    ) : (
      <Badge className="bg-red-600 text-white gap-1">
        <AlertTriangle className="h-3 w-3" />
        Unverified
      </Badge>
    );
  };

  const getAnalysisStatusBadge = (status: EvidenceItem["analysisStatus"]) => {
    const statusConfig = {
      pending: { color: "bg-gray-600", text: "Pending" },
      "in-progress": { color: "bg-yellow-600", text: "In Progress" },
      completed: { color: "bg-green-600", text: "Completed" }
    };
    
    const config = statusConfig[status];
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const getTimelineIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "case_created": return <Calendar className="h-4 w-4" />;
      case "evidence_uploaded": return <Upload className="h-4 w-4" />;
      case "analysis_started": return <Microscope className="h-4 w-4" />;
      case "analysis_completed": return <CheckCircle className="h-4 w-4" />;
      case "report_generated": return <FileText className="h-4 w-4" />;
      case "verification_completed": return <Hash className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTimelineColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "case_created": return "bg-blue-500";
      case "evidence_uploaded": return "bg-green-500";
      case "analysis_started": return "bg-yellow-500";
      case "analysis_completed": return "bg-green-600";
      case "report_generated": return "bg-purple-500";
      case "verification_completed": return "bg-indigo-500";
      default: return "bg-gray-500";
    }
  };

  const getNoteTypeColor = (type: InvestigationNote["type"]) => {
    switch (type) {
      case "observation": return "bg-blue-100 text-blue-800";
      case "finding": return "bg-green-100 text-green-800";
      case "hypothesis": return "bg-yellow-100 text-yellow-800";
      case "conclusion": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddNote = () => {
    if (newNote.title && newNote.content && selectedCase) {
      const note: InvestigationNote = {
        id: Date.now().toString(),
        caseId: selectedCase.caseId,
        title: newNote.title,
        content: newNote.content,
        createdAt: new Date().toISOString(),
        createdBy: "Forensic Analyst",
        type: newNote.type
      };
      setInvestigationNotes(prev => [note, ...prev]);
      setNewNote({ title: '', content: '', type: 'observation' });
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Forensic Analyst Dashboard</h1>
          <p className="text-muted-foreground">Investigate cases, verify evidence hashes and upload forensic reports</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showInvestigationPanel ? "default" : "outline"} 
            onClick={() => setShowInvestigationPanel(!showInvestigationPanel)}
          >
            <Microscope className="h-4 w-4 mr-2" />
            {showInvestigationPanel ? 'Hide Investigation' : 'Show Investigation'}
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <Hash className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Case ID Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Case by ID
          </CardTitle>
          <CardDescription>Enter a case ID to quickly find and view case details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter Case ID (e.g., CASE-2025-001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => {
              if (searchTerm.trim()) {
                const foundCase = cases.find(c => c.caseId.toLowerCase().includes(searchTerm.toLowerCase()));
                if (foundCase) {
                  setSelectedCase(foundCase);
                  setShowInvestigationPanel(true);
                } else {
                  alert(`Case ID "${searchTerm}" not found. Please check the case ID and try again.`);
                }
              }
            }} className="gap-2">
              <Search className="h-4 w-4" />
              Search Case
            </Button>
          </div>
          {searchTerm && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {cases.filter(c => c.caseId.toLowerCase().includes(searchTerm.toLowerCase())).length} matching case(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => e.hashVerified).length}</p>
                <p className="text-sm text-muted-foreground">Hash Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => e.analysisStatus === "in-progress").length}</p>
                <p className="text-sm text-muted-foreground">In Analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => e.reportUploaded).length}</p>
                <p className="text-sm text-muted-foreground">Reports Uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => !e.hashVerified).length}</p>
                <p className="text-sm text-muted-foreground">Hash Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investigation Panel */}
      {showInvestigationPanel && (
        <div className="space-y-6">
          {/* Search and Filter Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Cases
              </CardTitle>
              <CardDescription>Search and filter cases for investigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Advanced Search */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="case-search">Search Cases</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="case-search"
                      placeholder="Search by case ID, title, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="under-investigation">Under Investigation</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority-filter">Priority Filter</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Search Results Summary */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''} found
                  </span>
                  {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                    <Badge variant="outline" className="ml-2">
                      Filtered
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadData}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Results */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Case Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Results
                </CardTitle>
                <CardDescription>
                  {filteredCases.length > 0 
                    ? `Select a case to investigate and view timeline`
                    : 'No cases found matching your search criteria'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Cases Found</h3>
                    <p className="text-sm mb-4">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Try adjusting your search criteria or filters'
                        : 'No cases are currently available for investigation'
                      }
                    </p>
                    {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setPriorityFilter('all');
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCase?.id === caseItem.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCase(caseItem)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{caseItem.title}</h4>
                        <p className="text-sm text-muted-foreground">Case ID: {caseItem.caseId}</p>
                        <p className="text-sm text-muted-foreground">{caseItem.description}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{caseItem.status}</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{caseItem.category}</Badge>
                        <Badge variant="outline" className="text-xs">{caseItem.priority}</Badge>
                        <Badge variant="outline" className="text-xs">{caseItem.evidenceCount} files</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/investigate/${caseItem.caseId}`);
                        }}
                        className="gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Investigate
                      </Button>
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Investigation Timeline
              </CardTitle>
              <CardDescription>
                {selectedCase ? `Timeline for ${selectedCase.title}` : 'Select a case to view timeline'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCase ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {timeline
                    .filter(event => event.caseId === selectedCase.caseId)
                    .map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full ${getTimelineColor(event.type)} flex items-center justify-center text-white`}>
                          {getTimelineIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{event.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <p className="text-xs text-muted-foreground">By: {event.user}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a case to view its investigation timeline</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {/* Case Details and Notes */}
      {showInvestigationPanel && selectedCase && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Case Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Case Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <Label className="text-sm font-medium">Case ID</Label>
                  <p className="text-sm text-muted-foreground">{selectedCase.caseId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-muted-foreground">{selectedCase.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedCase.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="outline" className="capitalize">{selectedCase.status}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Badge variant="outline" className="capitalize">{selectedCase.priority}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">{new Date(selectedCase.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Blockchain Hash</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedCase.blockchainHash}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investigation Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Investigation Notes
              </CardTitle>
              <CardDescription>Add and manage investigation notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note Form */}
              <div className="space-y-3 p-3 border rounded-lg">
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Add investigation note..."
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Select value={newNote.type} onValueChange={(value: any) => setNewNote(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="observation">Observation</SelectItem>
                      <SelectItem value="finding">Finding</SelectItem>
                      <SelectItem value="hypothesis">Hypothesis</SelectItem>
                      <SelectItem value="conclusion">Conclusion</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddNote} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {investigationNotes
                  .filter(note => note.caseId === selectedCase.caseId)
                  .map((note) => (
                    <div key={note.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{note.title}</h4>
                        <Badge className={getNoteTypeColor(note.type)}>{note.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>By: {note.createdBy}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evidence for Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence for Analysis</CardTitle>
          <CardDescription>Verify hashes and upload forensic reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence ID</TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Blockchain Hash</TableHead>
                  <TableHead>Hash Status</TableHead>
                  <TableHead>Analysis Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <p>Loading evidence...</p>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-red-600">
                      <p>Error: {error}</p>
                      <Button variant="outline" size="sm" onClick={loadData} className="mt-2">
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : evidence.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <p>No evidence available for analysis</p>
                      <p className="text-sm">Evidence will appear here when available</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  evidence.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.evidenceId}</TableCell>
                      <TableCell>{item.caseId}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.fileName}>
                        {item.fileName}
                      </TableCell>
                      <TableCell>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</TableCell>
                      <TableCell>{new Date(item.uploadedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate" title={item.blockchainHash}>
                        {item.blockchainHash}
                      </TableCell>
                      <TableCell>{getHashStatusBadge(item.hashVerified)}</TableCell>
                      <TableCell>{getAnalysisStatusBadge(item.analysisStatus)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHashVerification(item.id)}
                            disabled={item.hashVerified}
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {item.hashVerified ? 'Verified' : 'Verify'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSignCustodyTransfer(item.evidenceId)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Sign
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
