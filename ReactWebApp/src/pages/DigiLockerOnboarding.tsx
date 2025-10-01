import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import DigiLockerOnboarding from "@/components/app/DigiLockerOnboarding";
import VerificationConfirmation from "@/components/app/VerificationConfirmation";

export default function DigiLockerOnboardingPage() {
  const navigate = useNavigate();
  const { linkDigiLocker, completeDigiLockerVerification } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationData, setVerificationData] = useState({
    officerName: "",
    department: "",
    employeeId: "",
    verificationDate: ""
  });

  const handleLinkDigiLocker = async () => {
    setIsLinking(true);
    
    try {
      const success = await linkDigiLocker();
      
      if (success) {
        // Simulate fetching verification data from DigiLocker
        // In real app, this would come from DigiLocker API response
        const mockVerificationData = {
          officerName: "Rajiv Sharma",
          department: "Delhi Police",
          employeeId: "DP-2024-001234",
          verificationDate: new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })
        };
        
        setVerificationData(mockVerificationData);
        setVerificationComplete(true);
        
        // Complete the verification in auth context
        completeDigiLockerVerification({
          name: mockVerificationData.officerName,
          department: mockVerificationData.department,
          employeeId: mockVerificationData.employeeId
        });
      }
    } catch (error) {
      console.error("DigiLocker linking failed:", error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleProceedToDashboard = () => {
    navigate("/dashboard");
  };

  if (verificationComplete) {
    return (
      <div className="h-screen flex items-start justify-center p-4 pt-16">
        <div className="w-full max-w-md space-y-3">
          <VerificationConfirmation 
            verificationData={verificationData}
            onProceedToDashboard={handleProceedToDashboard}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-start justify-center p-4 pt-16">
      <div className="w-full max-w-md space-y-3">
        <DigiLockerOnboarding 
          onLinkDigiLocker={handleLinkDigiLocker}
        />
      </div>
    </div>
  );
}
