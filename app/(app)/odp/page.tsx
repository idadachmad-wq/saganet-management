import { listOdcs, listOdps } from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { PageHeader } from "@/components/ui";
import { OdpClient } from "./odp-client";

export const metadata = { title: "ODP" };

export default async function OdpPage() {
  const [odps, odcs, permissions] = await Promise.all([
    listOdps(),
    listOdcs(),
    getSessionPermissions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Manajemen ODP"
        description="Input dan kelola ODP: kode, titik letak, kabel, warna tube/core, status port, serta tautan ke ODC induk."
      />
      <OdpClient
        odps={odps}
        odcOptions={odcs.map((o) => ({ id: o.id, code: o.code, name: o.name }))}
        canMutate={permissions.canMutatePsb}
      />
    </div>
  );
}
