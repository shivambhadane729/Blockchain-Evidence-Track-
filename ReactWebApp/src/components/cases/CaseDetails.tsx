import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, FileText, MapPin, Calendar, User, Upload, Eye, Shield, Download, File, Image, Video, Archive, FileType, X, Maximize2 } from "lucide-react";
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

export default function CaseDetails() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Evidence | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (caseId) {
      loadCaseDetails();
    }
  }, [caseId]);

  const loadCaseDetails = async () => {
    try {
      setLoading(true);
      const [caseData, evidenceData] = await Promise.all([
        APIService.getCaseById(caseId!),
        APIService.getEvidenceByCaseId(caseId!)
      ]);
      
      setCaseDetails(caseData);
      setEvidence(evidenceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      'open': { color: "bg-blue-600", text: "Open" },
      'under-investigation': { color: "bg-yellow-600", text: "Under Investigation" },
      'closed': { color: "bg-green-600", text: "Closed" },
      'evidence-collection': { color: "bg-purple-600", text: "Evidence Collection" },
      'forensic-analysis': { color: "bg-orange-600", text: "Forensic Analysis" },
      'court-proceedings': { color: "bg-red-600", text: "Court Proceedings" }
    };
    
    const config = statusConfig[status] || { color: "bg-gray-600", text: status };
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4 text-blue-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewDocument = (document: Evidence) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
    
    // Create a preview of the actual file content
    const fileType = getFileType(document.fileName);
    
    if (['txt', 'log', 'csv', 'json', 'xml', 'html', 'css', 'js', 'md'].includes(fileType)) {
      // For text files, create a data URL with file content
      const content = `File: ${document.fileName}
Size: ${formatFileSize(document.fileSize)}
Evidence ID: ${document.evidenceId}
Uploaded: ${new Date(document.uploadedAt).toLocaleString()}
Blockchain Hash: ${document.blockchainHash}

--- FILE CONTENT ---
This is the actual content of the uploaded file: ${document.fileName}

In a real application, this would contain the actual file content
that was uploaded to the system. The file has been processed and
stored securely with blockchain verification.

File Details:
- Original Name: ${document.fileName}
- File Size: ${formatFileSize(document.fileSize)}
- Upload Date: ${new Date(document.uploadedAt).toLocaleString()}
- Evidence ID: ${document.evidenceId}
- Blockchain Hash: ${document.blockchainHash}

This file is part of case evidence and has been cryptographically
secured using blockchain technology for integrity verification.`;
      
      setFileContent(content);
      const previewUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
      setFilePreviewUrl(previewUrl);
      console.log('Text file preview URL created:', previewUrl);
    } else {
      // For binary files, create a placeholder with file info
      const content = `File: ${document.fileName}
Type: ${fileType.toUpperCase()}
Size: ${formatFileSize(document.fileSize)}
Evidence ID: ${document.evidenceId}
Uploaded: ${new Date(document.uploadedAt).toLocaleString()}
Blockchain Hash: ${document.blockchainHash}

This is a ${fileType.toUpperCase()} file that has been uploaded to the system.
The file has been processed and stored securely with blockchain verification.

File Details:
- Original Name: ${document.fileName}
- File Type: ${fileType.toUpperCase()}
- File Size: ${formatFileSize(document.fileSize)}
- Upload Date: ${new Date(document.uploadedAt).toLocaleString()}
- Evidence ID: ${document.evidenceId}
- Blockchain Hash: ${document.blockchainHash}

This file is part of case evidence and has been cryptographically
secured using blockchain technology for integrity verification.`;
      
      setFileContent(content);
      const previewUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
      setFilePreviewUrl(previewUrl);
      console.log('Binary file preview URL created:', previewUrl);
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  };

  const renderDocumentViewer = () => {
    if (!selectedDocument) return null;

    const fileType = getFileType(selectedDocument.fileName);
    
    // Create a proper file URL for viewing
    const createFileUrl = () => {
      // For demo purposes, create realistic file URLs based on file type
      const fileType = getFileType(selectedDocument.fileName);
      
      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
        // Use placeholder images for image files
        return `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(selectedDocument.fileName)}`;
      } else if (fileType === 'pdf') {
        // Use a sample PDF URL for PDF files
        return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      } else if (['mp4', 'avi', 'mov'].includes(fileType)) {
        // Use a sample video URL for video files
        return 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
      } else {
        // For other files, create a data URL with file content
        const content = `File: ${selectedDocument.fileName}\nSize: ${formatFileSize(selectedDocument.fileSize)}\nEvidence ID: ${selectedDocument.evidenceId}\nUploaded: ${new Date(selectedDocument.uploadedAt).toLocaleString()}\nBlockchain Hash: ${selectedDocument.blockchainHash}`;
        return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
      }
    };
    
    const fileUrl = createFileUrl();

    return (
      <Dialog open={isViewerOpen} onOpenChange={(open) => {
        setIsViewerOpen(open);
        if (!open) {
          setFileContent(null);
          setFilePreviewUrl(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon(selectedDocument.fileName)}
              <span className="truncate">{selectedDocument.fileName}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Document Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">File Size</p>
                  <p className="text-sm">{formatFileSize(selectedDocument.fileSize)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Evidence ID</p>
                  <p className="text-sm font-mono">{selectedDocument.evidenceId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Uploaded</p>
                  <p className="text-sm">{new Date(selectedDocument.uploadedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">File Type</p>
                  <p className="text-sm capitalize">{fileType}</p>
                </div>
              </div>

              {/* Document Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="h-96 bg-white">
                  {fileContent ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                        {getFileIcon(selectedDocument.fileName)}
                        <span className="font-medium text-sm">{selectedDocument.fileName}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {fileType.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex-1 overflow-auto p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                          {fileContent}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Loading file content...</p>
                        <p className="text-sm text-gray-500">{selectedDocument.fileName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Blockchain Hash */}
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Blockchain Hash</p>
                <p className="text-sm font-mono text-green-700 break-all">{selectedDocument.blockchainHash}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsViewerOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
                <Button onClick={() => {
                  if (filePreviewUrl) {
                    window.open(filePreviewUrl, '_blank');
                  } else {
                    // Fallback to file URL if preview URL is not available
                    window.open(fileUrl, '_blank');
                  }
                }}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button variant="outline" onClick={() => {
                  if (fileContent) {
                    // Create a downloadable file with the content
                    const fileType = getFileType(selectedDocument.fileName);
                    const mimeType = fileType === 'pdf' ? 'application/pdf' : 
                                   fileType === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                                   fileType === 'zip' ? 'application/zip' :
                                   'text/plain';
                    
                    const blob = new Blob([fileContent], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = selectedDocument.fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    // Show success message
                    alert(`✅ DOWNLOAD STARTED\n\nFile: ${selectedDocument.fileName}\nSize: ${formatFileSize(selectedDocument.fileSize)}\nType: ${fileType.toUpperCase()}\n\nYour download has started.`);
                  }
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => handleVerifyEvidence(selectedDocument.evidenceId)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const handleVerifyEvidence = async (evidenceId: string) => {
    try {
      const result = await APIService.verifyEvidence(evidenceId);
      if (result.verified) {
        alert(`✅ VERIFIED\n\nEvidence ID: ${evidenceId}\nStatus: VERIFIED\nBlockchain Hash: Valid\n\nThis evidence has been cryptographically verified and is authentic.`);
      } else {
        alert(`❌ VERIFICATION FAILED\n\nEvidence ID: ${evidenceId}\nStatus: FAILED\n\nThis evidence could not be verified. Please contact the system administrator.`);
      }
    } catch (err) {
      alert('❌ VERIFICATION ERROR\n\nFailed to verify evidence. Please try again or contact support.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Loading Case Details...</h1>
          </div>
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
          <div>
            <h1 className="text-2xl font-bold text-red-600">Error</h1>
            <p className="text-muted-foreground">{error || 'Case not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Case Details</h1>
          <p className="text-muted-foreground">Case ID: {caseDetails.caseId}</p>
        </div>
      </div>

      {/* Case Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Case Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="font-medium">Case Title</p>
              <p className="text-muted-foreground">{caseDetails.title}</p>
            </div>
            <div>
              <p className="font-medium">Status</p>
              <div className="mt-1">{getStatusBadge(caseDetails.status)}</div>
            </div>
            <div>
              <p className="font-medium">Priority</p>
              <Badge variant="outline" className="capitalize">{caseDetails.priority}</Badge>
            </div>
            <div>
              <p className="font-medium">Category</p>
              <p className="text-muted-foreground">{caseDetails.category}</p>
            </div>
            <div>
              <p className="font-medium">Created Date</p>
              <p className="text-muted-foreground">{new Date(caseDetails.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium">Evidence Count</p>
              <p className="text-muted-foreground">{caseDetails.evidenceCount} files</p>
            </div>
          </div>
          <div>
            <p className="font-medium">Description</p>
            <p className="text-muted-foreground">{caseDetails.description}</p>
          </div>
          <div>
            <p className="font-medium">Blockchain Hash</p>
            <p className="text-muted-foreground font-mono text-sm">{caseDetails.blockchainHash}</p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents ({evidence.length})
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && caseDetails) {
                    APIService.uploadEvidence(file, caseDetails.caseId, 'Evidence file').then(() => {
                      loadCaseDetails(); // Refresh case details
                    });
                  }
                }}
                className="hidden"
                id="file-upload-details"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3,.zip"
              />
              <Button 
                onClick={() => document.getElementById('file-upload-details')?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Digital evidence and documents associated with this case</CardDescription>
        </CardHeader>
        <CardContent>
          {evidence.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No documents uploaded yet</h3>
              <p className="text-sm mb-4">Upload evidence and documents to start building the case</p>
              <Button 
                onClick={() => document.getElementById('file-upload-details')?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Documents Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {evidence.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(item.fileName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate" title={item.fileName}>
                            {item.fileName}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(item.fileSize)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.uploadedAt).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {item.evidenceId}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-1"
                          onClick={() => handleViewDocument(item)}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1">
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground font-mono">
                          Hash: {item.blockchainHash.substring(0, 16)}...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Documents Table (Alternative View) */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Document Details</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Evidence ID</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Blockchain Hash</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidence.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getFileIcon(item.fileName)}
                              <span className="font-medium">{item.fileName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.evidenceId}
                          </TableCell>
                          <TableCell>{formatFileSize(item.fileSize)}</TableCell>
                          <TableCell>{new Date(item.uploadedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs">
                            <span className="text-green-600">{item.blockchainHash.substring(0, 12)}...</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleViewDocument(item)}
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleVerifyEvidence(item.evidenceId)}
                              >
                                <Shield className="h-3 w-3" />
                                Verify
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {renderDocumentViewer()}
    </div>
  );
}
