import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

const toneStyles = {
  default: "from-primary/12 to-primary/0 text-primary",
  success: "from-success/15 to-success/0 text-success",
  warning: "from-warning/15 to-warning/0 text-warning",
  destructive: "from-destructive/15 to-destructive/0 text-destructive",
} as const;

export function KpiCard({ label, value, icon: Icon, hint, tone = "default", className }: KpiCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90 pointer-events-none",
          toneStyles[tone].split(" ").slice(0, 2).join(" "),
        )}
      />
      <CardContent className="relative flex items-center gap-4 p-6">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg bg-background/70 shadow-sm", toneStyles[tone].split(" ")[2])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
