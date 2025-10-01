import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Hash, 
  FileCheck, 
  Microscope, 
  Edit, 
  Plus, 
  Download,
  Eye,
  Shield,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Building,
  Activity,
  TrendingUp,
  Database,
  Lock,
  Unlock,
  Link,
  Copy,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Globe,
  Network,
  Layers,
  GitBranch,
  ShieldCheck,
  AlertCircle,
  Info,
  Play,
  Pause,
  Square,
  Maximize2,
  Minimize2,
  Settings,
  MoreVertical,
  Star,
  Bookmark,
  Share2,
  Printer,
  Archive,
  Trash2,
  Edit3,
  Save,
  X
} from "lucide-react";
import APIService from "@/services/api";

interface CaseDetails {
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

interface Evidence {
  id: string;
  evidenceId: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
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

interface BlockchainTransaction {
  id: string;
  hash: string;
  blockNumber: number;
  timestamp: string;
  type: "evidence_upload" | "verification" | "custody_transfer" | "analysis_complete";
  from: string;
  to: string;
  gasUsed: number;
  status: "confirmed" | "pending" | "failed";
}

interface ForensicAnalysis {
  id: string;
  evidenceId: string;
  type: "hash_analysis" | "metadata_extraction" | "content_analysis" | "integrity_check";
  status: "pending" | "running" | "completed" | "failed";
  result: any;
  confidence: number;
  createdAt: string;
  completedAt?: string;
}

interface CaseMetrics {
  totalEvidence: number;
  verifiedEvidence: number;
  analysisProgress: number;
  blockchainTransactions: number;
  investigationDays: number;
  riskScore: number;
}

export default function CaseInvestigation() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [investigationNotes, setInvestigationNotes] = useState<InvestigationNote[]>([]);
  const [blockchainTransactions, setBlockchainTransactions] = useState<BlockchainTransaction[]>([]);
  const [forensicAnalyses, setForensicAnalyses] = useState<ForensicAnalysis[]>([]);
  const [caseMetrics, setCaseMetrics] = useState<CaseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'observation' as const });
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'timeline' | 'notes' | 'blockchain' | 'analysis'>('overview');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (caseId) {
      loadCaseData();
    }
  }, [caseId]);

  const loadCaseData = async () => {
    if (!caseId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load case details
      const caseData = await APIService.getCaseById(caseId);
      if (caseData) {
        setCaseDetails(caseData);
        
        // Load evidence for this case
        const evidenceData = await APIService.getEvidenceByCaseId(caseId);
        setEvidence(evidenceData);
        
        // Generate timeline events
        const timelineEvents: TimelineEvent[] = [
          {
            id: `case-${caseData.id}`,
            timestamp: caseData.createdAt,
            type: "case_created",
            title: "Case Created",
            description: `Case ${caseData.caseId} was created: ${caseData.title}`,
            user: "System",
            caseId: caseData.caseId
          }
        ];
        
        // Add evidence upload events
        evidenceData.forEach((item: Evidence) => {
          timelineEvents.push({
            id: `evidence-${item.id}`,
            timestamp: item.uploadedAt,
            type: "evidence_uploaded",
            title: "Evidence Uploaded",
            description: `Evidence ${item.evidenceId} uploaded: ${item.fileName}`,
            user: "Field Officer",
            caseId: caseData.caseId,
            evidenceId: item.evidenceId
          });
        });
        
        // Sort timeline by timestamp
        timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTimeline(timelineEvents);
        
        // Generate mock investigation notes
        const mockNotes: InvestigationNote[] = [
          {
            id: '1',
            caseId: caseData.caseId,
            title: 'Initial Evidence Review',
            content: 'Initial review of uploaded evidence files. All files appear to be intact and properly uploaded.',
            createdAt: new Date().toISOString(),
            createdBy: 'Forensic Analyst',
            type: 'observation'
          },
          {
            id: '2',
            caseId: caseData.caseId,
            title: 'Hash Verification Complete',
            content: 'All evidence files have been verified for integrity. Blockchain hashes are valid and match the uploaded files.',
            createdAt: new Date().toISOString(),
            createdBy: 'Forensic Analyst',
            type: 'finding'
          }
        ];
        setInvestigationNotes(mockNotes);

        // Generate mock blockchain transactions
        const mockTransactions: BlockchainTransaction[] = [
          {
            id: '1',
            hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
            blockNumber: 12345678,
            timestamp: caseData.createdAt,
            type: 'evidence_upload',
            from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            to: '0x8ba1f109551bD432803012645Hac136c4c8b8b8b',
            gasUsed: 21000,
            status: 'confirmed'
          },
          {
            id: '2',
            hash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234',
            blockNumber: 12345679,
            timestamp: new Date().toISOString(),
            type: 'verification',
            from: '0x8ba1f109551bD432803012645Hac136c4c8b8b8b',
            to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            gasUsed: 45000,
            status: 'confirmed'
          }
        ];
        setBlockchainTransactions(mockTransactions);

        // Generate mock forensic analyses
        const mockAnalyses: ForensicAnalysis[] = [
          {
            id: '1',
            evidenceId: evidenceData[0]?.evidenceId || '',
            type: 'hash_analysis',
            status: 'completed',
            result: { algorithm: 'SHA-256', hash: 'abc123...', verified: true },
            confidence: 99.8,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          },
          {
            id: '2',
            evidenceId: evidenceData[0]?.evidenceId || '',
            type: 'metadata_extraction',
            status: 'running',
            result: null,
            confidence: 0,
            createdAt: new Date().toISOString()
          }
        ];
        setForensicAnalyses(mockAnalyses);

        // Generate case metrics
        const investigationDays = Math.floor((new Date().getTime() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const metrics: CaseMetrics = {
          totalEvidence: evidenceData.length,
          verifiedEvidence: 0,
          analysisProgress: 45,
          blockchainTransactions: mockTransactions.length,
          investigationDays,
          riskScore: 75
        };
        setCaseMetrics(metrics);
      }
    } catch (err) {
      setError('Failed to load case data');
      console.error('Error loading case data:', err);
    } finally {
      setLoading(false);
    }
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
    if (newNote.title && newNote.content && caseDetails) {
      const note: InvestigationNote = {
        id: Date.now().toString(),
        caseId: caseDetails.caseId,
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

  const handleVerifyEvidence = async (evidenceId: string) => {
    try {
      const result = await APIService.verifyEvidence(evidenceId);
      if (result.verified) {
        alert(`✅ HASH VERIFIED\n\nEvidence ID: ${evidenceId}\nStatus: VERIFIED\n\nHash verification successful! Evidence is authentic.`);
      } else {
        alert(`❌ HASH VERIFICATION FAILED\n\nEvidence ID: ${evidenceId}\n\nHash verification failed. Please investigate further.`);
      }
    } catch (err) {
      alert('❌ VERIFICATION ERROR\n\nFailed to verify evidence hash. Please try again.');
      console.error('Hash verification error:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTransactionTypeIcon = (type: BlockchainTransaction["type"]) => {
    switch (type) {
      case "evidence_upload": return <Upload className="h-4 w-4" />;
      case "verification": return <ShieldCheck className="h-4 w-4" />;
      case "custody_transfer": return <GitBranch className="h-4 w-4" />;
      case "analysis_complete": return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTransactionTypeColor = (type: BlockchainTransaction["type"]) => {
    switch (type) {
      case "evidence_upload": return "bg-blue-500";
      case "verification": return "bg-green-500";
      case "custody_transfer": return "bg-purple-500";
      case "analysis_complete": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getAnalysisTypeIcon = (type: ForensicAnalysis["type"]) => {
    switch (type) {
      case "hash_analysis": return <Hash className="h-4 w-4" />;
      case "metadata_extraction": return <Database className="h-4 w-4" />;
      case "content_analysis": return <FileText className="h-4 w-4" />;
      case "integrity_check": return <Shield className="h-4 w-4" />;
      default: return <Microscope className="h-4 w-4" />;
    }
  };

  const getAnalysisStatusColor = (status: ForensicAnalysis["status"]) => {
    switch (status) {
      case "pending": return "bg-gray-500";
      case "running": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const startForensicAnalysis = async (evidenceId: string, type: ForensicAnalysis["type"]) => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      const newAnalysis: ForensicAnalysis = {
        id: Date.now().toString(),
        evidenceId,
        type,
        status: 'running',
        result: null,
        confidence: 0,
        createdAt: new Date().toISOString()
      };
      setForensicAnalyses(prev => [newAnalysis, ...prev]);
      setIsAnalyzing(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading case investigation...</p>
        </div>
      </div>
    );
  }

  if (error || !caseDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Case Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || 'The requested case could not be found.'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{caseDetails.title}</h1>
            <p className="text-muted-foreground">Case ID: {caseDetails.caseId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize">{caseDetails.status}</Badge>
          <Badge variant="outline" className="capitalize">{caseDetails.priority}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: FileText },
          { id: 'evidence', label: 'Evidence', icon: Upload },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'blockchain', label: 'Blockchain', icon: Network },
          { id: 'analysis', label: 'Analysis', icon: Microscope },
          { id: 'notes', label: 'Notes', icon: Edit }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
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
                  <p className="text-sm text-muted-foreground font-mono">{caseDetails.caseId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-muted-foreground">{caseDetails.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{caseDetails.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="outline" className="capitalize">{caseDetails.status}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Badge variant="outline" className="capitalize">{caseDetails.priority}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm text-muted-foreground">{caseDetails.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">{new Date(caseDetails.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Evidence Count</Label>
                  <p className="text-sm text-muted-foreground">{caseDetails.evidenceCount} files</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Blockchain Hash</Label>
                  <p className="text-sm text-muted-foreground font-mono break-all">{caseDetails.blockchainHash}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Investigation Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseMetrics && (
                <div className="grid gap-4">
                  {/* Risk Score */}
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Risk Score</span>
                      </div>
                      <span className={`text-2xl font-bold ${getRiskScoreColor(caseMetrics.riskScore)}`}>
                        {caseMetrics.riskScore}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${caseMetrics.riskScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {caseMetrics.riskScore >= 80 ? 'High Risk' : 
                       caseMetrics.riskScore >= 60 ? 'Medium Risk' : 
                       caseMetrics.riskScore >= 40 ? 'Low Risk' : 'Minimal Risk'}
                    </p>
                  </div>

                  {/* Analysis Progress */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Analysis Progress</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{caseMetrics.analysisProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${caseMetrics.analysisProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Evidence</span>
                      </div>
                      <Badge variant="outline">{caseMetrics.totalEvidence}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                      <Badge variant="outline">{caseMetrics.verifiedEvidence}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Blockchain</span>
                      </div>
                      <Badge variant="outline">{caseMetrics.blockchainTransactions}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Days</span>
                      </div>
                      <Badge variant="outline">{caseMetrics.investigationDays}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'evidence' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Evidence Files
            </CardTitle>
            <CardDescription>All evidence files associated with this case</CardDescription>
          </CardHeader>
          <CardContent>
            {evidence.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No evidence files found for this case</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evidence.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedEvidence?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEvidence(item)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.fileName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Evidence ID: {item.evidenceId} • {formatFileSize(item.fileSize)} • {new Date(item.uploadedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Hash: {item.blockchainHash}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedEvidence?.id === item.id ? "default" : "outline"} 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvidence(item);
                        }}
                      >
                        <Target className="h-4 w-4 mr-1" />
                        {selectedEvidence?.id === item.id ? 'Selected' : 'Select'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleVerifyEvidence(item.evidenceId);
                      }}>
                        <Shield className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Investigation Timeline
            </CardTitle>
            <CardDescription>Complete timeline of case activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full ${getTimelineColor(event.type)} flex items-center justify-center text-white flex-shrink-0`}>
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
          </CardContent>
        </Card>
      )}

      {activeTab === 'blockchain' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Blockchain Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Blockchain Transactions
              </CardTitle>
              <CardDescription>All blockchain transactions for this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blockchainTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getTransactionTypeColor(tx.type)} flex items-center justify-center text-white`}>
                          {getTransactionTypeIcon(tx.type)}
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">{tx.type.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">
                            Block #{tx.blockNumber} • {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                        {tx.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Transaction Hash:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {tx.hash.slice(0, 20)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tx.hash)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">From:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tx.from.slice(0, 10)}...
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">To:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tx.to.slice(0, 10)}...
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Gas Used:</span>
                        <span>{tx.gasUsed.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Network Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Network Status
              </CardTitle>
              <CardDescription>Current blockchain network information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Network Status</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Current Block</span>
                  </div>
                  <span className="font-mono text-sm">#12,345,678</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Gas Price</span>
                  </div>
                  <span className="font-mono text-sm">20 Gwei</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Security Level</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">High</Badge>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Case Blockchain Hash</h4>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded flex-1">
                    {caseDetails?.blockchainHash}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(caseDetails?.blockchainHash || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This hash represents the cryptographic fingerprint of all case data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Forensic Analysis Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5" />
                Forensic Analysis Tools
              </CardTitle>
              <CardDescription>Advanced forensic analysis capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start gap-3 h-auto p-4"
                  onClick={() => selectedEvidence && startForensicAnalysis(selectedEvidence.evidenceId, 'hash_analysis')}
                  disabled={!selectedEvidence || isAnalyzing}
                >
                  <Hash className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Hash Analysis</div>
                    <div className="text-sm text-muted-foreground">Verify file integrity and detect tampering</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start gap-3 h-auto p-4"
                  onClick={() => selectedEvidence && startForensicAnalysis(selectedEvidence.evidenceId, 'metadata_extraction')}
                  disabled={!selectedEvidence || isAnalyzing}
                >
                  <Database className="h-5 w-5 text-green-500" />
                  <div className="text-left">
                    <div className="font-medium">Metadata Extraction</div>
                    <div className="text-sm text-muted-foreground">Extract file metadata and timestamps</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start gap-3 h-auto p-4"
                  onClick={() => selectedEvidence && startForensicAnalysis(selectedEvidence.evidenceId, 'content_analysis')}
                  disabled={!selectedEvidence || isAnalyzing}
                >
                  <FileText className="h-5 w-5 text-purple-500" />
                  <div className="text-left">
                    <div className="font-medium">Content Analysis</div>
                    <div className="text-sm text-muted-foreground">Analyze file content for evidence</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start gap-3 h-auto p-4"
                  onClick={() => selectedEvidence && startForensicAnalysis(selectedEvidence.evidenceId, 'integrity_check')}
                  disabled={!selectedEvidence || isAnalyzing}
                >
                  <Shield className="h-5 w-5 text-orange-500" />
                  <div className="text-left">
                    <div className="font-medium">Integrity Check</div>
                    <div className="text-sm text-muted-foreground">Comprehensive file integrity verification</div>
                  </div>
                </Button>
              </div>
              
              {selectedEvidence && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Evidence:</strong> {selectedEvidence.fileName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analysis Results
              </CardTitle>
              <CardDescription>Results from forensic analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forensicAnalyses.map((analysis) => (
                  <div key={analysis.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getAnalysisStatusColor(analysis.status)} flex items-center justify-center text-white`}>
                          {getAnalysisTypeIcon(analysis.type)}
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">{analysis.type.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">
                            Evidence: {analysis.evidenceId} • {new Date(analysis.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'}>
                          {analysis.status}
                        </Badge>
                        {analysis.status === 'completed' && (
                          <span className="text-sm font-medium text-green-600">
                            {analysis.confidence}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {analysis.status === 'completed' && analysis.result && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <h5 className="font-medium mb-2">Results:</h5>
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(analysis.result, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {analysis.status === 'running' && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Analysis in progress...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add Note */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Investigation Note
              </CardTitle>
              <CardDescription>Add new notes to the investigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Add investigation note..."
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
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
                  <Button onClick={handleAddNote} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Investigation Notes
              </CardTitle>
              <CardDescription>All notes for this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {investigationNotes.map((note) => (
                  <div key={note.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{note.title}</h4>
                      <Badge className={getNoteTypeColor(note.type)}>{note.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{note.content}</p>
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
    </div>
  );
}
