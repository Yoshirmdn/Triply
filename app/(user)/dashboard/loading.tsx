export default function DashboardLoading() {
  return (
    <div
      className="animate-pulse space-y-6"
      aria-busy="true"
      aria-label="Memuat"
    >
      <div className="h-8 w-56 rounded-lg bg-neutral-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 rounded-xl bg-neutral-200" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-neutral-200" />
    </div>
  );
}
