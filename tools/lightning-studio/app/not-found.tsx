import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <p className="text-sm uppercase tracking-[0.28em] text-primary">404</p>
      <h1 className="text-4xl font-semibold tracking-tight">Tool not found</h1>
      <p className="max-w-xl text-base leading-7 text-muted-foreground">
        The route you requested does not match a current Lightning Studio tool page.
      </p>
      <Button asChild>
        <Link href="/tools">Back to the tool directory</Link>
      </Button>
    </div>
  );
}
