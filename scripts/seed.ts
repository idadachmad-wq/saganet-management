import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: existingIsp } = await supabase
    .from("isp_partners")
    .select("id")
    .eq("code", "ISP-01")
    .maybeSingle();

  if (!existingIsp) {
    const { error } = await supabase.from("isp_partners").insert({
      code: "ISP-01",
      name: "Mitra Fiber Prima",
      phone: "081234567890",
    });
    if (error) throw error;
  }

  await supabase.from("profit_share_settings").delete().neq("id", "");
  const { error: settingError } = await supabase
    .from("profit_share_settings")
    .insert({
      ppn_rate: 0.11,
      bhp_uso_rate: 0.0175,
      saganet_share: 0.65,
      isp_share: 0.35,
    });
  if (settingError) throw settingError;

  console.log("Seed selesai: mitra ISP + skema bagi hasil.");
  console.log("Tidak mengisi pelanggan/PSB/keuangan demo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
