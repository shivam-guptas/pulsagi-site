import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed border-white/10 bg-white/[0.02]">
      <CardContent className="flex min-h-52 flex-col items-center justify-center gap-4 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
