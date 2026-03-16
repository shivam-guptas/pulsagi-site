"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <p className="text-sm uppercase tracking-[0.28em] text-primary">Something went wrong</p>
      <h1 className="text-4xl font-semibold tracking-tight">Lightning Studio hit an unexpected error.</h1>
      <p className="max-w-xl text-base leading-7 text-muted-foreground">
        Refresh the page or retry the action. If the issue keeps happening, the current input may be malformed or the endpoint may be blocking the browser request.
      </p>
      <Button type="button" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
