import { redirect } from "next/navigation";
import { listFinanceEntries } from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { PageHeader } from "@/components/ui";
import { KeuanganClient } from "./keuangan-client";

export const metadata = { title: "Keuangan" };

export default async function KeuanganPage() {
  const permissions = await getSessionPermissions();
  if (!permissions.canViewFinance) redirect("/dashboard");

  const entries = await listFinanceEntries();

  return (
    <div>
      <PageHeader
        title="Keuangan"
        description="Tab Ringkasan menampilkan semua pemasukan dan pengeluaran per jenis. Pilih sub-menu jenis (invoice, shodaqoh, belanja, DTT, voucher mitra, tanggungan) untuk input detail."
      />
      <KeuanganClient
        entries={entries}
        canMutate={permissions.canMutateFinance}
      />
    </div>
  );
}
