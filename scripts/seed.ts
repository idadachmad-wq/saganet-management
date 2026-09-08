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

  console.log("Seed selesai: skema bagi hasil.");
  console.log("Tidak mengisi mitra ISP / pelanggan / PSB / keuangan demo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
