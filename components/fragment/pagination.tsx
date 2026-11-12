import Link from "next/link";

type PaginationProps = {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
};

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ basePath, params, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const linkClass = "rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50";
  const disabledClass = "rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-300";

  return (
    <div className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={buildHref(basePath, params, page - 1)} className={linkClass}>
          Sebelumnya
        </Link>
      ) : (
        <span className={disabledClass}>Sebelumnya</span>
      )}
      <span className="text-sm text-neutral-500">
        Halaman {page} dari {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={buildHref(basePath, params, page + 1)} className={linkClass}>
          Berikutnya
        </Link>
      ) : (
        <span className={disabledClass}>Berikutnya</span>
      )}
    </div>
  );
}