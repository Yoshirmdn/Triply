import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listActivityQuerySchema } from "@/lib/validations/admin.schema";
import { Pagination } from "@/components/fragment/pagination";
import { formatDateTimeID } from "@/utils/date";

export const metadata = { title: "Aktivitas" };

type ActivityPageProps = {
  searchParams: Promise<{ action?: string; page?: string }>;
};

export default async function AdminActivityPage({ searchParams }: ActivityPageProps) {
  await requirePageRole("SUPER_ADMIN");
  const raw = await searchParams;
  const parsed = listActivityQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listActivityQuerySchema.parse({});

  const where = query.action ? { action: query.action } : {};

  const [logs, total, actions] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Aktivitas</h1>
        <p className="mt-1 text-sm text-neutral-600">{total} catatan aktivitas.</p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <select
          name="action"
          defaultValue={query.action ?? ""}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Semua aksi</option>
          {actions.map((row) => (
            <option key={row.action} value={row.action}>
              {row.action}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900">
          Filter
        </button>
      </form>

      {logs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Belum ada aktivitas.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {logs.map((log) => (
            <li key={log.id} className="flex flex-wrap items-start justify-between gap-2 px-5 py-3">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm text-neutral-900">{log.description}</p>
                <p className="text-xs text-neutral-500">
                  {log.user ? (log.user.name ?? log.user.email) : "Sistem"} · {log.action}
                </p>
              </div>
              <span className="text-xs text-neutral-400">{formatDateTimeID(log.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

      <Pagination basePath="/admin/activity" params={{ action: query.action }} page={query.page} totalPages={totalPages} />
    </div>
  );
}