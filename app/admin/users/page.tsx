import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listUsersQuerySchema } from "@/lib/validations/admin.schema";
import { Pagination } from "@/components/fragment/pagination";
import { UserActions } from "@/components/fragment/user-actions";
import { formatDateID } from "@/utils/date";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pengguna" };

type UsersPageProps = {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const actor = await requirePageRole("SUPER_ADMIN");
  const raw = await searchParams;
  const parsed = listUsersQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listUsersQuerySchema.parse({});

  const where = {
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { isActive: query.status === "active" } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { trips: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const inputClass = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Pengguna</h1>
        <p className="mt-1 text-sm text-neutral-600">{total} pengguna terdaftar.</p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input name="q" defaultValue={query.q} placeholder="Cari nama atau email" className={cn(inputClass, "min-w-56 flex-1")} />
        <select name="role" defaultValue={query.role ?? ""} className={inputClass}>
          <option value="">Semua role</option>
          <option value="USER">User</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <select name="status" defaultValue={query.status ?? ""} className={inputClass}>
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <button type="submit" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-176 text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Pengguna</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Trip</th>
              <th className="px-4 py-3 font-medium">Bergabung</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  Tidak ada pengguna yang cocok.
                </td>
              </tr>
            ) : null}
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{user.name ?? "—"}</p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                    )}
                  >
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-700">{user._count.trips}</td>
                <td className="px-4 py-3 text-neutral-600">{formatDateID(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <UserActions userId={user.id} role={user.role} isActive={user.isActive} isSelf={user.id === actor.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        basePath="/admin/users"
        params={{ q: query.q, role: query.role, status: query.status }}
        page={query.page}
        totalPages={totalPages}
      />
    </div>
  );
}