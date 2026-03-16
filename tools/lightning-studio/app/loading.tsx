export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-6 w-32 animate-pulse rounded-full bg-white/10" />
      <div className="h-14 w-full max-w-3xl animate-pulse rounded-3xl bg-white/10" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[420px] animate-pulse rounded-[1.5rem] bg-white/10" />
        <div className="h-[420px] animate-pulse rounded-[1.5rem] bg-white/10" />
      </div>
    </div>
  );
}
