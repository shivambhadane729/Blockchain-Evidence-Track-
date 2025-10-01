import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle } from "lucide-react";

interface DigiLockerBadgeProps {
  verificationDate?: string;
  className?: string;
}

export default function DigiLockerBadge({ verificationDate, className }: DigiLockerBadgeProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`bg-green-50 text-green-700 border-green-200 gap-1 ${className}`}
          >
            <CheckCircle className="h-3 w-3" />
            DigiLocker Verified
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Identity verified through DigiLocker on {verificationDate ? formatDate(verificationDate) : 'recently'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
