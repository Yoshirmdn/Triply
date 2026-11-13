import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-teal-800">
        404
      </p>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Halaman tidak ditemukan
      </h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Tautan mungkin salah, sudah dimatikan oleh pemiliknya, atau datanya
        sudah dihapus.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
