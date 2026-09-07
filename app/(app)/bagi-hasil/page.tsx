import {
  getProfitShareSetting,
  listInvoicesInRange,
} from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { redirect } from "next/navigation";
import { PageHeader, KpiCard } from "@/components/ui";
import {
  calculateProfitShare,
  DEFAULT_RATES,
  formatPercent,
  formatRp,
} from "@/lib/bagi-hasil";
import { BagiHasilExport } from "./bagi-hasil-export";

export const metadata = { title: "Bagi Hasil ISP" };

export default async function BagiHasilPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const permissions = await getSessionPermissions();
  if (!permissions.canViewFinance) redirect("/dashboard");

  const params = await searchParams;
  const now = new Date();
  const monthValue =
    params.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = monthValue.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const setting = (await getProfitShareSetting()) ?? DEFAULT_RATES;

  const invoices = await listInvoicesInRange(
    start.toISOString(),
    end.toISOString(),
  );

  const gross = invoices.reduce((sum, item) => sum + item.amount, 0);
  const breakdown = calculateProfitShare(gross, {
    ppnRate: setting.ppnRate,
    bhpUsoRate: setting.bhpUsoRate,
    saganetShare: setting.saganetShare,
    ispShare: setting.ispShare,
  });

  const rows = [
    { label: "Omzet Invoice (Gross)", value: breakdown.gross },
    {
      label: `PPN ${formatPercent(breakdown.rates.ppnRate)}`,
      value: breakdown.ppn,
    },
    { label: "Setelah PPN", value: breakdown.setelahPpn },
    {
      label: `BHPUSO ${formatPercent(breakdown.rates.bhpUsoRate)}`,
      value: breakdown.bhpuso,
    },
    { label: "Net bagi hasil", value: breakdown.net },
    {
      label: `Bagian SaGa-Net ${formatPercent(breakdown.rates.saganetShare)}`,
      value: breakdown.saganet,
    },
    {
      label: `Bagian ISP ${formatPercent(breakdown.rates.ispShare)}`,
      value: breakdown.isp,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bagi Hasil ISP"
        description="Skema: potong PPN 11%, lalu BHPUSO 1,75%, kemudian bagi hasil SaGa-Net 65% dan ISP 35%."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <form className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <input
                className="input"
                type="month"
                name="month"
                defaultValue={monthValue}
              />
              <button className="btn btn-ghost w-full sm:w-auto" type="submit">
                Terapkan
              </button>
            </form>
            <BagiHasilExport
              monthValue={monthValue}
              rows={rows}
              invoices={invoices.map((inv) => ({
                description: inv.description,
                occurredAt: inv.occurredAt,
                amount: inv.amount,
                paymentMethod: inv.paymentMethod,
              }))}
            />
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Gross Invoice" value={formatRp(breakdown.gross)} accent="brand" />
        <KpiCard label="Net Setelah Pajak" value={formatRp(breakdown.net)} accent="violet" />
        <KpiCard label="SaGa-Net 65%" value={formatRp(breakdown.saganet)} accent="cyan" />
        <KpiCard label="ISP 35%" value={formatRp(breakdown.isp)} accent="orange" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h3 className="font-semibold text-[var(--text)]">Breakdown Perhitungan</h3>
          </div>
          <div className="divide-y divide-[var(--border)]/70">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="text-[var(--muted)]">{row.label}</span>
                <span className="font-semibold text-[var(--text)]">
                  {formatRp(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="font-semibold text-[var(--text)]">Invoice periode ini</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {invoices.length} transaksi masuk kategori Uang Invoice
          </p>
          <div className="mt-4 space-y-3">
            {invoices.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-6 text-center text-sm text-[var(--muted)]">
                Belum ada invoice di bulan ini.
              </p>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text)]">
                        {inv.description}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {new Date(inv.occurredAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <p className="font-semibold text-[var(--text)]">
                      {formatRp(inv.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
