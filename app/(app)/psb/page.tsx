import { listPsbOrders } from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { PageHeader, EmptyState } from "@/components/ui";
import { PsbClient } from "./psb-client";

export const metadata = { title: "PSB" };

export default async function PsbPage() {
  const [orders, permissions] = await Promise.all([
    listPsbOrders(),
    getSessionPermissions(),
  ]);

  return (
    <div>
      <PageHeader
        title="PSB"
        description="Rekap pasang baru pelanggan: dari lead, survey, pemasangan, hingga aktif."
      />
      {orders.length === 0 ? (
        <EmptyState message="Belum ada data PSB. Tambahkan pelanggan baru untuk mulai pipeline." />
      ) : null}
      <PsbClient orders={orders} canMutate={permissions.canMutatePsb} />
    </div>
  );
}
