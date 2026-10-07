import {
  getProfitShareSetting,
  listCustomers,
  listFinanceEntries,
  listFinanceSince,
  listPsbOrders,
  listRecentPsb,
} from "@/lib/db";
import { getSessionPermissions } from "@/lib/app-user";
import { PageHeader, KpiCard } from "@/components/ui";
import { RevenueChart } from "@/components/dashboard/revenue-chart-lazy";
import { MonthFilter } from "@/components/month-filter";
import {
  calculateProfitShare,
  DEFAULT_RATES,
  formatPercent,
  formatRp,
} from "@/lib/bagi-hasil";
import { APP_NAME, PSB_STATUS_LABELS } from "@/lib/constants";
import { startOfMonth, subMonths, format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const metadata = { title: "Dashboard" };

function occurredMonth(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "yyyy-MM");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const perms = await getSessionPermissions();
  const params = await searchParams;
  const now = new Date();
  const monthValue =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = monthValue.split("-").map(Number);
  const selectedMonth = new Date(year, month - 1, 1);
  const chartStart = startOfMonth(subMonths(selectedMonth, 5));
  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: localeId });
  const chartStartLabel = format(chartStart, "MMMM yyyy", { locale: localeId });

  const [customers, psbOrders, setting, recentPsb, financeAll, financeEntries] =
    await Promise.all([
      listCustomers(),
      listPsbOrders(),
      perms.canViewFinance ? getProfitShareSetting() : Promise.resolve(null),
      listRecentPsb(5),
      perms.canViewFinance
        ? listFinanceSince(chartStart.toISOString())
        : Promise.resolve([]),
      perms.canViewFinance ? listFinanceEntries() : Promise.resolve([]),
    ]);

  const psbAktifTotal = psbOrders.filter((o) => o.status === "aktif").length;
  const custAktifTotal = customers.filter((c) => c.status === "aktif").length;

  const activeCustomers = customers.filter(
    (c) =>
      c.status === "aktif" && occurredMonth(c.installedAt) === monthValue,
  ).length;

  const openPsb = psbOrders.filter((o) => {
    if (!["lead", "survey", "install"].includes(o.status)) return false;
    const key =
      occurredMonth(o.installDate) ||
      occurredMonth(o.installAt) ||
      occurredMonth(o.createdAt);
    return key === monthValue;
  }).length;
  const monthInvoices = financeAll.filter(
    (e) =>
      e.category === "invoice" &&
      e.type === "masuk" &&
      occurredMonth(e.occurredAt) === monthValue,
  );
  const monthTanggungan = financeAll
    .filter(
      (e) =>
        e.category === "tanggungan" &&
        occurredMonth(e.occurredAt) === monthValue,
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

  const shareRows = [
    { label: "Omzet Invoice (Gross)", value: share.gross },
    {
      label: `PPN ${formatPercent(share.rates.ppnRate)}`,
      value: share.ppn,
    },
    { label: "Setelah PPN", value: share.setelahPpn },
    {
      label: `BHPUSO ${formatPercent(share.rates.bhpUsoRate)}`,
      value: share.bhpuso,
    },
    { label: "Net bagi hasil", value: share.net },
    {
      label: `Bagian SaGa-Net ${formatPercent(share.rates.saganetShare)}`,
      value: share.saganet,
      highlight: true as const,
    },
    {
      label: `Bagian ISP ${formatPercent(share.rates.ispShare)}`,
      value: share.isp,
    },
  ];

  const chartData = Array.from({ length: 6 }, (_, idx) => {
    const d = subMonths(selectedMonth, 5 - idx);
    const key = format(d, "yyyy-MM");
    const label = format(d, "MMM", { locale: localeId });
    const bulanEntries = financeAll.filter(
      (e) => occurredMonth(e.occurredAt) === key,
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
        <p className="banner-sub relative z-[1] mt-3 max-w-2xl text-sm leading-relaxed md:text-base">
          {perms.canViewFinance
            ? `Semua KPI dan bagi hasil mengikuti filter bulan di bawah. Pantau pelanggan aktif yang terpasang, pipeline PSB, omzet invoice, tanggungan, arus kas 6 bulan, serta skema bagi hasil ISP untuk ${monthLabel}.`
            : `Semua KPI mengikuti filter bulan di bawah. Pantau pelanggan aktif yang terpasang dan pipeline PSB untuk ${monthLabel}. Data keuangan tidak ditampilkan untuk akun teknisi.`}
        </p>
      </div>

      <PageHeader
        title="Dashboard"
        description={
          perms.canViewFinance
            ? `Ringkasan operasional ${monthLabel}: pelanggan aktif dihitung dari tanggal pemasangan, PSB berjalan dari status lead/survey/install, omzet & tanggungan dari transaksi bulan itu. Grafik arus kas menampilkan 6 bulan terakhir sampai ${monthLabel}.`
            : `Ringkasan operasional ${monthLabel}: pelanggan aktif dihitung dari tanggal pemasangan, PSB berjalan dari status lead/survey/install pada bulan terpilih.`
        }
        actions={
          <MonthFilter value={monthValue} ariaLabel="Bulan dashboard" />
        }
      />

      <p className="mb-2 text-sm font-semibold text-[var(--text)]">
        Ringkasan keseluruhan (semua data)
      </p>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="PSB"
          value={String(psbOrders.length)}
          hint={`${psbAktifTotal} aktif`}
          accent="orange"
        />
        <KpiCard
          label="Pelanggan"
          value={String(customers.length)}
          hint={`${custAktifTotal} aktif`}
          accent="cyan"
        />
        {perms.canViewFinance ? (
          <KpiCard
            label="Keuangan"
            value={String(financeEntries.length)}
            hint="Semua entri"
            accent="violet"
          />
        ) : (
          <KpiCard
            label="Mode"
            value="Field"
            hint="PSB & pelanggan"
            accent="green"
          />
        )}
      </div>

      <p className="mb-2 text-sm font-semibold text-[var(--text)]">
        Ringkasan {monthLabel}
      </p>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pelanggan Aktif"
          value={String(activeCustomers)}
          hint={`Status aktif dengan tanggal pemasangan di ${monthLabel}`}
          accent="cyan"
        />
        <KpiCard
          label="PSB Berjalan"
          value={String(openPsb)}
          hint={`Lead, survey, atau install yang tanggalnya di ${monthLabel}`}
          accent="orange"
        />
        {perms.canViewFinance ? (
          <>
            <KpiCard
              label="Omzet Invoice"
              value={formatRp(gross)}
              hint={`Total transaksi invoice masuk di ${monthLabel}`}
              accent="brand"
            />
            <KpiCard
              label="Tanggungan"
              value={formatRp(monthTanggungan)}
              hint={`Total kategori tanggungan di ${monthLabel}`}
              accent="pink"
            />
          </>
        ) : null}
      </div>

      {perms.canViewFinance ? (
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="panel p-4 md:p-5">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-[var(--text)]">
                Arus Kas 6 Bulan
              </h3>
              <span className="badge">
                Sampai{" "}
                {format(selectedMonth, "MMM yy", { locale: localeId })}
              </span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
              Perbandingan kas masuk dan keluar dari {chartStartLabel} sampai{" "}
              {monthLabel}. Digeser otomatis saat filter bulan diubah.
            </p>
            <RevenueChart key={monthValue} data={chartData} />
          </div>

          <div className="panel p-4 md:p-5">
            <h3 className="font-semibold text-[var(--text)]">
              Bagi Hasil {monthLabel}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Dihitung dari omzet invoice {monthLabel}: potong PPN{" "}
              {formatPercent(share.rates.ppnRate)}, lalu BHPUSO{" "}
              {formatPercent(share.rates.bhpUsoRate)}, kemudian dibagi SaGa-Net{" "}
              {formatPercent(share.rates.saganetShare)} dan ISP{" "}
              {formatPercent(share.rates.ispShare)}.
            </p>
            <div className="mt-5 space-y-3">
              {shareRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-[var(--muted)]">{row.label}</span>
                  <span
                    className={`font-semibold ${
                      "highlight" in row && row.highlight
                        ? "text-[var(--brand)]"
                        : "text-[var(--text)]"
                    }`}
                  >
                    {formatRp(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 panel p-4 md:p-5">
        <h3 className="font-semibold text-[var(--text)]">PSB Terbaru</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
          5 order PSB terbaru lintas status. Daftar ini tidak mengikuti filter
          bulan di atas.
        </p>
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
