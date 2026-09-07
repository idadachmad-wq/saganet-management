import {
  countActiveCustomers,
  countOpenPsb,
  getProfitShareSetting,
  listFinanceSince,
  listRecentPsb,
} from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { PageHeader, KpiCard } from "@/components/ui";
import { RevenueChart } from "@/components/dashboard/revenue-chart-lazy";
import {
  calculateProfitShare,
  DEFAULT_RATES,
  formatRp,
} from "@/lib/bagi-hasil";
import { APP_NAME, PSB_STATUS_LABELS } from "@/lib/constants";
import { startOfMonth, subMonths, format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const perms = await getSessionPermissions();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const chartStart = startOfMonth(subMonths(now, 5));

  const [activeCustomers, openPsb, setting, recentPsb, financeAll] =
    await Promise.all([
      countActiveCustomers(),
      countOpenPsb(),
      perms.canViewFinance ? getProfitShareSetting() : Promise.resolve(null),
      listRecentPsb(5),
      perms.canViewFinance
        ? listFinanceSince(chartStart.toISOString())
        : Promise.resolve([]),
    ]);

  const monthInvoices = financeAll.filter(
    (e) =>
      e.category === "invoice" &&
      e.type === "masuk" &&
      new Date(e.occurredAt) >= monthStart,
  );
  const monthTanggungan = financeAll
    .filter(
      (e) =>
        e.category === "tanggungan" && new Date(e.occurredAt) >= monthStart,
    )
    .reduce((s, e) => s + e.amount, 0);

  const gross = monthInvoices.reduce((s, i) => s + i.amount, 0);
  const rates = setting ?? DEFAULT_RATES;
  const share = calculateProfitShare(gross, {
    ppnRate: rates.ppnRate,
    bhpUsoRate: rates.bhpUsoRate,
    saganetShare: rates.saganetShare,
    ispShare: rates.ispShare,
  });

  const chartData = Array.from({ length: 6 }, (_, idx) => {
    const d = subMonths(now, 5 - idx);
    const key = format(d, "yyyy-MM");
    const label = format(d, "MMM", { locale: localeId });
    const bulanEntries = financeAll.filter(
      (e) => format(new Date(e.occurredAt), "yyyy-MM") === key,
    );
    return {
      label,
      masuk: bulanEntries
        .filter((e) => e.type === "masuk")
        .reduce((s, e) => s + e.amount, 0),
      keluar: bulanEntries
        .filter((e) => e.type === "keluar")
        .reduce((s, e) => s + e.amount, 0),
    };
  });

  return (
    <div>
      <div className="brand-banner relative mb-5 overflow-hidden p-5 md:mb-6 md:p-7">
        <p className="relative z-[1] text-xs font-bold uppercase tracking-[0.2em]">
          SaGa-Net
        </p>
        <h2 className="relative z-[1] mt-2 max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
          {APP_NAME}
        </h2>
        <p className="banner-sub relative z-[1] mt-3 max-w-2xl text-sm md:text-base">
          {perms.canViewFinance
            ? "Pantau pelanggan aktif, pipeline PSB, arus kas, dan bagi hasil ISP dalam satu workspace."
            : "Pantau pelanggan aktif dan pipeline PSB. Data keuangan tersimpan tidak ditampilkan untuk akun teknisi."}
        </p>
      </div>

      <PageHeader
        title="Dashboard"
        description={`Ringkasan operasional ${format(now, "MMMM yyyy", { locale: localeId })}`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pelanggan Aktif"
          value={String(activeCustomers)}
          hint="Customer terpasang"
          accent="cyan"
        />
        <KpiCard
          label="PSB Berjalan"
          value={String(openPsb)}
          hint="Lead / survey / install"
          accent="orange"
        />
        {perms.canViewFinance ? (
          <>
            <KpiCard
              label="Omzet Invoice"
              value={formatRp(gross)}
              hint="Bulan ini"
              accent="brand"
            />
            <KpiCard
              label="Tanggungan"
              value={formatRp(monthTanggungan)}
              hint="Bulan ini"
              accent="pink"
            />
          </>
        ) : null}
      </div>

      {perms.canViewFinance ? (
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="panel p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-[var(--text)]">Arus Kas 6 Bulan</h3>
            <span className="badge">Masuk vs Keluar</span>
          </div>
          <RevenueChart data={chartData} />
        </div>

        <div className="panel p-4 md:p-5">
          <h3 className="font-semibold text-[var(--text)]">Bagi Hasil Bulan Ini</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Setelah PPN 11% & BHPUSO 1,75%
          </p>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--muted)]">Net</span>
              <span className="font-semibold text-[var(--text)]">
                {formatRp(share.net)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--muted)]">SaGa-Net 65%</span>
              <span className="font-semibold text-[var(--brand)]">
                {formatRp(share.saganet)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--muted)]">ISP 35%</span>
              <span className="font-semibold text-[var(--text)]">
                {formatRp(share.isp)}
              </span>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      <div className="mt-5 panel p-4 md:p-5">
        <h3 className="font-semibold text-[var(--text)]">PSB Terbaru</h3>
        <div className="mt-4 space-y-3">
          {recentPsb.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--text)]">
                  {item.customerName}
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {item.address}
                </p>
              </div>
              <span className="badge badge-muted shrink-0">
                {PSB_STATUS_LABELS[item.status]}
              </span>
            </div>
          ))}
          {recentPsb.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Belum ada data PSB.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
