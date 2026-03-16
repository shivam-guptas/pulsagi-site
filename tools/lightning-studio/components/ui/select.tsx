import type { SelectHTMLAttributes } from "react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
