"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, apiDelete } from "@/lib/api-client";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/validations/account.schema";
import type { AccountImpactDTO } from "@/@type/account";

type DeleteAccountProps = {
  email: string;
  impact: AccountImpactDTO;
};

export function DeleteAccount({ email, impact }: DeleteAccountProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = confirm.trim() === DELETE_ACCOUNT_CONFIRMATION;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiDelete("/account", { confirm: confirm.trim() });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal menghapus akun");
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-red-200 bg-white p-6">
      <div>
        <h2 className="font-semibold text-red-700">Hapus akun</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Menghapus akun <strong>{email}</strong> secara permanen beserta semua perjalanan yang kamu miliki. Tindakan ini tidak bisa dibatalkan.
        </p>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
        <li>{impact.ownedTrips} perjalanan milikmu akan ikut terhapus.</li>
        {impact.sharedOwnedTrips > 0 ? (
          <li className="text-red-700">
            {impact.sharedOwnedTrips} di antaranya dibagikan ke orang lain, jadi mereka juga kehilangan akses.
          </li>
        ) : null}
        <li>Perjalanan orang lain yang kamu ikuti tetap ada, tetapi kamu tidak lagi tercatat di dalamnya.</li>
      </ul>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
        >
          Hapus akun saya
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">
              Ketik <code className="rounded bg-neutral-100 px-1.5 py-0.5">{DELETE_ACCOUNT_CONFIRMATION}</code> untuk melanjutkan
            </span>
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="off"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!ready || busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "Menghapus..." : "Hapus permanen"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}