import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, User, Building } from "lucide-react";

interface VerificationData {
  officerName: string;
  department: string;
  employeeId: string;
  verificationDate: string;
}

export default function VerificationConfirmation({ 
  verificationData, 
  onProceedToDashboard 
}: { 
  verificationData: VerificationData;
  onProceedToDashboard: () => void;
}) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <CardTitle className="text-xl text-green-600">Verification Successful</CardTitle>
        <CardDescription className="text-sm">
          Your DigiLocker account has been linked, and your credentials are verified.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Verification Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-semibold text-sm">{verificationData.officerName}</p>
              <p className="text-xs text-muted-foreground">Officer Name</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Building className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-semibold text-sm">{verificationData.department}</p>
              <p className="text-xs text-muted-foreground">Department</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-semibold text-sm">{verificationData.employeeId}</p>
              <p className="text-xs text-muted-foreground">Employee ID</p>
            </div>
          </div>
        </div>
        
        {/* Verified Badge */}
        <div className="flex justify-center">
          <Badge className="bg-green-600 text-white gap-2 px-4 py-2">
            <CheckCircle className="h-4 w-4" />
            Government Verified (via DigiLocker)
          </Badge>
        </div>
        
        {/* Proceed Button */}
        <Button 
          onClick={onProceedToDashboard}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Proceed to Dashboard
        </Button>
        
        {/* Verification Date */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Verified on {verificationData.verificationDate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
