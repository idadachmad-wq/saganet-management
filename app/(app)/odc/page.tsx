import { listOdcs } from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { PageHeader } from "@/components/ui";
import { OdcClient } from "./odc-client";

export const metadata = { title: "ODC" };

export default async function OdcPage() {
  const [odcs, permissions] = await Promise.all([
    listOdcs(),
    getSessionPermissions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Manajemen ODC"
        description="Input ODC: titik letak, kabel, warna tube/core, feeder OLT, splitter, kapasitas core, dan status port. ODP dapat ditautkan ke ODC induk."
      />
      <OdcClient odcs={odcs} canMutate={permissions.canMutatePsb} />
    </div>
  );
}
