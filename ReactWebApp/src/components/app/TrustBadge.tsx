import { CheckCircle2 } from "lucide-react";

export function TrustBadge({ label = "Blockchain Verified" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-glow">
      <span className="relative inline-flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-30" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <CheckCircle2 className="h-4 w-4 text-accent" />
      <span>{label}</span>
    </div>
  );
}
