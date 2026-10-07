import { listOdps } from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { PageHeader } from "@/components/ui";
import { OdpClient } from "./odp-client";

export const metadata = { title: "ODP" };

export default async function OdpPage() {
  const [odps, permissions] = await Promise.all([
    listOdps(),
    getSessionPermissions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Manajemen ODP"
        description="Input dan kelola ODP: kode, titik letak, kabel, warna tube/core, serta status tiap port."
      />
      <OdpClient odps={odps} canMutate={permissions.canMutatePsb} />
    </div>
  );
}
