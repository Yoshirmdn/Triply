"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserPlus, X } from "lucide-react";
import {
  ApiClientError,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import {
  MEMBER_ROLES,
  MEMBER_ROLE_HINTS,
  MEMBER_ROLE_LABELS,
  type MemberRoleValue,
} from "@/data/member";
import { cn } from "@/lib/utils";
import type { TripPeopleDTO, TripPersonDTO } from "@/@type/member";

type TripMembersProps = {
  tripId: string;
  currentUserId: string;
  initialPeople: TripPersonDTO[];
  isOwner: boolean;
};

function initials(person: TripPersonDTO): string {
  const source = person.name?.trim() || person.email;
  return source.slice(0, 1).toUpperCase();
}

export function TripMembers({
  tripId,
  currentUserId,
  initialPeople,
  isOwner,
}: TripMembersProps) {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRoleValue>("VIEWER");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reload() {
    const data = await apiGet<TripPeopleDTO>(`/trips/${tripId}/members`);
    setPeople(data.people);
  }

  function messageOf(err: unknown, fallback: string) {
    return err instanceof ApiClientError ? err.message : fallback;
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await apiPost<{ status: "member" | "invite" }>(
        `/trips/${tripId}/members`,
        { email, role },
      );
      setNotice(
        result.status === "member"
          ? "Teman ditambahkan sebagai anggota."
          : "Undangan dibuat. Akan aktif saat temanmu masuk dengan Google memakai email ini. Triply tidak mengirim email, jadi kabari dia langsung.",
      );
      setEmail("");
      await reload();
    } catch (err) {
      setError(messageOf(err, "Gagal mengundang"));
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(person: TripPersonDTO, next: MemberRoleValue) {
    setBusyId(person.id);
    setError(null);
    try {
      await apiPatch(`/trips/${tripId}/members/${person.id}`, { role: next });
      await reload();
    } catch (err) {
      setError(messageOf(err, "Gagal mengubah peran"));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(person: TripPersonDTO) {
    const self = person.userId === currentUserId;
    const question = self
      ? "Keluar dari perjalanan ini? Kamu tidak akan bisa melihatnya lagi kecuali diundang ulang."
      : person.kind === "invite"
        ? `Batalkan undangan untuk ${person.email}?`
        : `Keluarkan ${person.name ?? person.email} dari perjalanan?`;
    if (!window.confirm(question)) return;

    setBusyId(person.id);
    setError(null);
    try {
      if (person.kind === "invite") {
        await apiDelete(`/trips/${tripId}/invites/${person.id}`);
      } else {
        await apiDelete(`/trips/${tripId}/members/${person.id}`);
      }
      if (self) {
        router.push("/dashboard/trips");
        router.refresh();
        return;
      }
      await reload();
    } catch (err) {
      setError(messageOf(err, "Gagal menghapus"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Anggota</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {isOwner
            ? "Undang teman untuk menyusun perjalanan bersama. Editor bisa mengubah itinerary dan pengeluaran, pelihat hanya bisa melihat."
            : "Orang yang ikut dalam perjalanan ini."}
        </p>
      </div>

      <ul className="divide-y divide-neutral-200">
        {people.map((person) => {
          const self = person.userId === currentUserId;
          const busy = busyId === person.id;
          return (
            <li
              key={`${person.kind}-${person.id}`}
              className="flex flex-wrap items-center gap-3 py-3"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  person.kind === "invite"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-teal-100 text-teal-900",
                )}
              >
                {person.kind === "invite" ? (
                  <Mail className="size-4" />
                ) : (
                  initials(person)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {person.name ?? person.email}
                  {self ? (
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      (kamu)
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {person.name ? person.email : null}
                  {person.kind === "invite"
                    ? `${person.name ? " · " : ""}Menunggu login pertama`
                    : null}
                </p>
              </div>

              {person.kind === "owner" ? (
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                  {MEMBER_ROLE_LABELS.OWNER}
                </span>
              ) : isOwner ? (
                <div className="flex items-center gap-2">
                  <select
                    value={person.role}
                    disabled={busy || person.kind === "invite"}
                    onChange={(event) =>
                      void changeRole(
                        person,
                        event.target.value as MemberRoleValue,
                      )
                    }
                    aria-label={`Peran ${person.email}`}
                    className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm disabled:bg-neutral-100"
                  >
                    {MEMBER_ROLES.map((value) => (
                      <option key={value} value={value}>
                        {MEMBER_ROLE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void remove(person)}
                    disabled={busy}
                    aria-label={
                      person.kind === "invite"
                        ? "Batalkan undangan"
                        : "Keluarkan anggota"
                    }
                    className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                    {MEMBER_ROLE_LABELS[person.role]}
                  </span>
                  {self ? (
                    <button
                      type="button"
                      onClick={() => void remove(person)}
                      disabled={busy}
                      className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                    >
                      Keluar
                    </button>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {isOwner ? (
        <form
          onSubmit={invite}
          className="space-y-3 border-t border-neutral-200 pt-5"
        >
          <div className="flex flex-wrap gap-2">
            <label className="min-w-56 flex-1">
              <span className="sr-only">Email teman</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email Google temanmu"
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
              />
            </label>
            <label>
              <span className="sr-only">Peran</span>
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as MemberRoleValue)
                }
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
              >
                {MEMBER_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {MEMBER_ROLE_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-60"
            >
              <UserPlus className="size-4" />
              {inviting ? "Mengundang..." : "Undang"}
            </button>
          </div>
          <p className="text-xs text-neutral-500">{MEMBER_ROLE_HINTS[role]}</p>
        </form>
      ) : null}

      {notice ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
