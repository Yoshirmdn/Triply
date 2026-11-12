"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, apiPatch } from "@/lib/api-client";

type UserActionsProps = {
  userId: string;
  role: "SUPER_ADMIN" | "USER";
  isActive: boolean;
  isSelf: boolean;
};

export function UserActions({ userId, role, isActive, isSelf }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(payload: { role?: "SUPER_ADMIN" | "USER"; isActive?: boolean }) {
    setLoading(true);
    setError(null);
    try {
      await apiPatch(`/admin/users/${userId}`, payload);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gagal memperbarui pengguna");
    } finally {
      setLoading(false);
    }
  }

  if (isSelf) return <span className="text-xs text-neutral-400">Akun kamu</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={role}
          disabled={loading}
          onChange={(event) => void update({ role: event.target.value as "SUPER_ADMIN" | "USER" })}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs disabled:opacity-60"
        >
          <option value="USER">User</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const message = isActive ? "Nonaktifkan pengguna ini? Dia tidak bisa login lagi." : "Aktifkan pengguna ini?";
            if (window.confirm(message)) void update({ isActive: !isActive });
          }}
          className={
            isActive
              ? "rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              : "rounded-lg border border-teal-200 px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50 disabled:opacity-60"
          }
        >
          {isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </div>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}