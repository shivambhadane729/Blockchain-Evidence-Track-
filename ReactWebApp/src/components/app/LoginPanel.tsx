import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Info, Shield, Clock, AlertTriangle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginFormData {
  role: string;
  email: string;
  password: string;
  otp: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const ROLES = [
  // Core Roles (Essential for Prototype)
  { value: "field-investigating-officer", label: "Field/Investigating Officer (IO)", category: "core" },
  { value: "station-house-officer", label: "Station House Officer (SHO)", category: "core" },
  { value: "evidence-custodian", label: "Evidence Custodian (Malkhana In-Charge)", category: "core" },
  { value: "forensic-lab-technician", label: "Forensic Lab Technician/Analyst", category: "core" },
  { value: "forensic-lab-manager", label: "Forensic Lab Manager", category: "core" },
  { value: "public-prosecutor", label: "Public Prosecutor", category: "core" },
  { value: "court-clerk", label: "Court Clerk/Registrar", category: "core" },
  { value: "judge-magistrate", label: "Judge/Magistrate", category: "core" },
  { value: "system-admin", label: "System Admin/Auditor", category: "core" },
  
  // Optional Roles (Advanced / Future Phases)
  { value: "courier-transport", label: "Courier/Transport Staff", category: "optional" },
  { value: "external-lab", label: "External/Private Labs", category: "optional" },
  { value: "ngo-verifier", label: "NGO/Verifier", category: "optional" },
  { value: "law-enforcement-hq", label: "Law Enforcement HQ/Command", category: "optional" },
];

const APPROVED_DOMAINS = [
  ".gov",
  ".mil",
  ".chainguard.app",
  "delhipolice.gov",
  "mumbai.gov",
  "bangalore.gov",
  "chennai.gov",
  "kolkata.gov",
  "hyderabad.gov",
];

export default function LoginPanel({ onSignIn }: { onSignIn?: (formData: LoginFormData) => Promise<boolean> }) {
  const [formData, setFormData] = useState<LoginFormData>({
    role: "",
    email: "",
    password: "",
    otp: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(600); // 10 minutes

  // Password strength calculation
  const calculatePasswordStrength = useCallback((password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "text-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "text-yellow-500" };
    return { score, label: "Strong", color: "text-green-500" };
  }, []);

  const passwordStrength = calculatePasswordStrength(formData.password);

  // Email validation
  const validateEmail = useCallback((email: string): boolean => {
    if (!email) return false;
    // For testing, accept any email with @ symbol
    return email.includes('@');
  }, []);

  // OTP resend timer
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendTimer]);

  // Session timeout warning
  useEffect(() => {
    if (sessionTimeout > 0) {
      const timer = setTimeout(() => setSessionTimeout(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [sessionTimeout]);

  const handleInputChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const handleOtpChange = useCallback((value: string) => {
    // Auto-advance between digits
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, otp: digits }));
  }, []);

  const handleResendOtp = useCallback(() => {
    setOtpResendTimer(30);
    // In real app, trigger OTP resend API call
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.role) {
      newErrors.role = "Please select your role";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Use your official government email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.otp) {
      newErrors.otp = "One-time code is required";
    } else if (formData.otp.length !== 6) {
      newErrors.otp = "Invalid code. Try again";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateEmail, passwordStrength.score]);

  const handleSubmit = useCallback(async () => {
    if (isLocked) return;

    if (!validateForm()) {
      setFailedAttempts(prev => prev + 1);
      if (failedAttempts >= 4) {
        setIsLocked(true);
        // In real app, send alert to admin
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the new authentication system
      const success = await onSignIn(formData);
      
      if (success) {
        // Reset failed attempts on successful login
        setFailedAttempts(0);
      } else {
        setFailedAttempts(prev => prev + 1);
        if (failedAttempts >= 4) {
          setIsLocked(true);
        }
      }
    } catch (error) {
      setFailedAttempts(prev => prev + 1);
      if (failedAttempts >= 4) {
        setIsLocked(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, isLocked, failedAttempts, onSignIn, formData]);

  const isFormValid = formData.role && formData.email && formData.password && formData.otp;

  return (
    <TooltipProvider>
      <Card id="login" className="w-full max-w-xl mx-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CardTitle className="text-2xl font-bold text-gray-900">Login</CardTitle>
          </div>
          <CardDescription className="text-gray-600">Access is restricted to authorized government personnel</CardDescription>
          
          {/* Security Notice */}
          <Alert className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Use a government-issued device on a secure network.
            </AlertDescription>
          </Alert>

          {/* Session Timeout Warning */}
          {sessionTimeout < 60 && sessionTimeout > 0 && (
            <Alert className="mt-2">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Session will timeout in {sessionTimeout} seconds due to inactivity.
              </AlertDescription>
            </Alert>
          )}

          {/* Lockout Warning */}
          {isLocked && (
            <Alert className="mt-2 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-xs text-red-600">
                Account locked due to multiple failed attempts. Contact your administrator.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-6 px-8">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Role Selector */}
          <div className="grid gap-1.5">
            <Label htmlFor="role" className="flex items-center gap-2">
              Select Role
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-semibold">Role-Based Access Control</p>
                    <p className="text-sm">Your role determines the features and permissions you can access in the system.</p>
                    <p className="text-xs text-muted-foreground">
                      Choose from 13 different roles including investigators, lab staff, prosecutors, judges, and administrators.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger 
                id="role" 
                className={cn(
                  "h-12 transition-all duration-200 text-gray-900 border-2 hover:border-blue-300 focus:border-blue-500",
                  formData.role && "border-blue-500 bg-blue-50 text-gray-900"
                )}
                aria-describedby="role-tooltip"
              >
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="text-black">
                {ROLES.map((role) => (
                  <SelectItem 
                    key={role.value} 
                    value={role.value}
                    className="focus:bg-blue-50 hover:bg-blue-50 hover:text-black focus:text-black text-black"
                  >
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
          </div>

          {/* Official Email */}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Official Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@agency.gov"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              autoComplete="off"
              className={cn(
                "h-12 transition-all duration-200 text-gray-900 border-2 hover:border-blue-300 focus:border-blue-500",
                formData.email && "border-blue-500 bg-blue-50 text-gray-900",
                errors.email && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={cn(
                  "h-12 pr-10 transition-all duration-200 text-gray-900 border-2 hover:border-blue-300 focus:border-blue-500",
                  formData.password && "border-blue-500 bg-blue-50 text-gray-900",
                  errors.password && "border-red-500 focus:border-red-500"
                )}
                aria-describedby="password-strength"
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Password Strength Meter */}
            {formData.password && (
              <div id="password-strength" className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        passwordStrength.score <= 2 && "bg-red-500 w-1/3",
                        passwordStrength.score === 3 && "bg-yellow-500 w-2/3",
                        passwordStrength.score >= 4 && "bg-green-500 w-full"
                      )}
                      role="progressbar"
                      aria-valuenow={passwordStrength.score}
                      aria-valuemin={0}
                      aria-valuemax={5}
                      aria-label={`Password strength: ${passwordStrength.label}`}
                    />
                  </div>
                  <span className={cn("text-xs font-medium", passwordStrength.color)}>
                    {passwordStrength.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: 12+ characters, 1 uppercase, 1 number, 1 symbol
                </p>
              </div>
            )}
            
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Send OTP Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendOtp}
              disabled={!formData.email || !formData.password || otpResendTimer > 0}
              className="gap-2"
            >
              {otpResendTimer > 0 ? (
                <>
                  <Clock className="h-4 w-4" />
                  Resend in {otpResendTimer}s
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>
          </div>

          {/* One-Time Code */}
          <div className="grid gap-1.5">
            <Label htmlFor="otp">One-Time Code (2FA)</Label>
            <Input
              id="otp"
              inputMode="numeric"
              placeholder="000000"
              value={formData.otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              maxLength={6}
              className={cn(
                "h-12 text-center text-lg tracking-widest transition-all duration-200 text-gray-900 border-2 hover:border-blue-300 focus:border-blue-500",
                formData.otp && "border-blue-500 bg-blue-50 text-gray-900",
                errors.otp && "border-red-500 focus:border-red-500"
              )}
              aria-describedby="otp-help"
              autoComplete="one-time-code"
            />
            
            {/* OTP Help */}
            <div id="otp-help" className="text-sm">
              <span className="text-muted-foreground">
                Supports hardware tokens, SMS, or email OTP
              </span>
            </div>
            
            {errors.otp && (
              <p className="text-sm text-red-500">{errors.otp}</p>
            )}
          </div>

          {/* Form Buttons */}
          <div className="flex w-full gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="flex-1 h-12 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold transition-all duration-200">
                  Request Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Account Access</DialogTitle>
                  <DialogDescription>
                    To request an account, contact your station's admin or email security@chainguard.app
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please provide the following information:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Full name and official title</li>
                    <li>• Government agency/department</li>
                    <li>• Official email address</li>
                    <li>• Justification for access</li>
                    <li>• Supervisor approval</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              type="submit"
              disabled={!isFormValid || isSubmitting || isLocked}
              className="flex-1 h-12 bg-gradient-to-r from-blue-900 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </div>
          
          {/* Failed Attempts Counter */}
          {failedAttempts > 0 && !isLocked && (
            <p className="text-sm text-yellow-600">
              Failed attempts: {failedAttempts}/5
            </p>
          )}
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
