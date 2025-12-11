import { Shield } from "lucide-react";

interface HipaaNoticeProps {
  variant?: "banner" | "footer" | "inline";
  className?: string;
}

export function HipaaNotice({ variant = "footer", className = "" }: HipaaNoticeProps) {
  if (variant === "banner") {
    return (
      <div className={`bg-blue-50 border-l-4 border-blue-500 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">HIPAA Compliant Platform</p>
            <p className="text-xs text-blue-800 mt-1">
              This system is HIPAA compliant and maintains the highest standards for protecting patient health information (PHI).
              All data is encrypted in transit and at rest.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-600 ${className}`}>
        <Shield className="h-4 w-4 text-blue-600" />
        <span>HIPAA Compliant • All patient data is encrypted and secure</span>
      </div>
    );
  }

  // Default: footer variant
  return (
    <div className={`flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 border-t text-xs text-gray-600 ${className}`}>
      <Shield className="h-4 w-4 text-blue-600" />
      <span>HIPAA Compliant Platform • Patient data is encrypted and secure</span>
    </div>
  );
}
