import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/permissions";
import { loadAccount, loadAccountImpact } from "@/lib/account-helpers";
import { SettingsForm } from "@/components/fragment/settings-form";
import { DeleteAccount } from "@/components/fragment/delete-account";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const actor = await requirePageUser();
  const [account, impact] = await Promise.all([loadAccount(actor.id), loadAccountImpact(actor.id)]);
  if (!account) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-neutral-500">Atur profil dan preferensi default perjalananmu.</p>
      </div>

      <SettingsForm account={account} />
      <DeleteAccount email={account.email} impact={impact} />
    </div>
  );
}