import { listCustomers } from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { PageHeader, EmptyState } from "@/components/ui";
import { PelangganClient } from "./pelanggan-client";

export const metadata = { title: "Pelanggan" };

export default async function PelangganPage() {
  const [customers, permissions] = await Promise.all([
    listCustomers(),
    getSessionPermissions(),
  ]);
  const canMutate = permissions.canMutatePsb;

  return (
    <div>
      <PageHeader
        title="Pelanggan"
        description="Daftar pelanggan dari PSB aktif. Ubah status aktif, isolir, atau putus."
      />
      {customers.length === 0 ? (
        <EmptyState message="Belum ada pelanggan. Aktifkan PSB untuk menambahkan pelanggan otomatis." />
      ) : null}
      <PelangganClient customers={customers} canMutate={canMutate} />
    </div>
  );
}
