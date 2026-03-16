import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type StatusTone = "info" | "success" | "warning";

const toneMap = {
  info: {
    icon: Info,
    className: "border-sky-400/15 bg-sky-400/10 text-sky-100"
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-400/15 bg-emerald-400/10 text-emerald-100"
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-400/15 bg-amber-400/10 text-amber-100"
  }
} satisfies Record<StatusTone, { icon: typeof Info; className: string }>;

export function StatusCallout({
  tone = "info",
  title,
  description
}: {
  tone?: StatusTone;
  title: string;
  description: string;
}) {
  const Icon = toneMap[tone].icon;

  return (
    <div className={cn("rounded-2xl border p-4", toneMap[tone].className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm leading-6 text-current/80">{description}</p>
        </div>
      </div>
    </div>
  );
}
