export default function ShareLoading() {
  return (
    <div
      className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-8"
      aria-busy="true"
      aria-label="Memuat"
    >
      <div className="h-9 w-72 rounded-lg bg-neutral-200" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-xl bg-neutral-200" />
        <div className="h-96 rounded-xl bg-neutral-200" />
      </div>
    </div>
  );
}
