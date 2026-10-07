"use client";

import { useMemo, useState, useTransition } from "react";
import {
  FINANCE_TABS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type FinanceTabKey,
  type PaymentMethodKey,
} from "@/lib/constants";
import { formatRp } from "@/lib/bagi-hasil";
import {
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
} from "./actions";
import type { FinanceEntry } from "@/lib/types";
import { NumberInput } from "@/components/number-input";
import { downloadCsv } from "@/lib/export-csv";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type ViewTab = "ringkasan" | FinanceTabKey;

const CATEGORY_LABELS = Object.fromEntries(
  FINANCE_TABS.map((t) => [t.key, t.label]),
) as Record<FinanceTabKey, string>;

const CATEGORY_ACCENTS = [
  "brand",
  "cyan",
  "orange",
  "violet",
  "green",
  "pink",
] as const;

function toDateInput(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function inMonth(iso: string, monthValue: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return format(d, "yyyy-MM") === monthValue;
}

function matchesQuery(entry: FinanceEntry, q: string) {
  if (!q) return true;
  const hay = [
    entry.description,
    entry.reference,
    entry.paymentMethod,
    entry.type,
    CATEGORY_LABELS[entry.category as FinanceTabKey] ?? entry.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function KeuanganClient({
  entries,
  canMutate,
}: {
  entries: FinanceEntry[];
  canMutate: boolean;
}) {
  const [tab, setTab] = useState<ViewTab>("ringkasan");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodKey>("tunai");
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState(() =>
    format(new Date(), "yyyy-MM"),
  );
  const [allMonths, setAllMonths] = useState(false);

  const isRingkasan = tab === "ringkasan";
  const tabMeta = isRingkasan
    ? null
    : FINANCE_TABS.find((t) => t.key === tab)!;

  const monthLabel = useMemo(() => {
    if (allMonths) return "Semua bulan";
    const [y, m] = monthFilter.split("-").map(Number);
    if (!y || !m) return monthFilter;
    return format(new Date(y, m - 1, 1), "MMM yyyy", { locale: localeId });
  }, [allMonths, monthFilter]);

  const monthEntries = useMemo(() => {
    return entries
      .filter((e) => (allMonths ? true : inMonth(e.occurredAt, monthFilter)))
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );
  }, [entries, monthFilter, allMonths]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (isRingkasan) {
      return monthEntries.filter((e) => matchesQuery(e, q));
    }
    return monthEntries.filter(
      (e) => e.category === tab && matchesQuery(e, q),
    );
  }, [monthEntries, isRingkasan, tab, query]);

  const totalMasuk = filtered
    .filter((e) => e.type === "masuk")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalKeluar = filtered
    .filter((e) => e.type === "keluar")
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryStats = useMemo(() => {
    return FINANCE_TABS.map((item, idx) => {
      const rows = monthEntries.filter((e) => e.category === item.key);
      const masuk = rows
        .filter((e) => e.type === "masuk")
        .reduce((s, e) => s + e.amount, 0);
      const keluar = rows
        .filter((e) => e.type === "keluar")
        .reduce((s, e) => s + e.amount, 0);
      return {
        key: item.key,
        label: item.label,
        count: rows.length,
        masuk,
        keluar,
        saldo: masuk - keluar,
        accent: CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length],
      };
    });
  }, [monthEntries]);

  const today = new Date().toISOString().slice(0, 10);

  function selectTab(next: ViewTab) {
    setTab(next);
    if (!editing) {
      setShowForm(false);
      setEditing(null);
      setPaymentMethod("tunai");
    }
  }

  function openCreate() {
    if (isRingkasan) return;
    setEditing(null);
    setPaymentMethod("tunai");
    setShowForm(true);
  }

  function openEdit(entry: FinanceEntry) {
    setEditing(entry);
    setTab(entry.category as FinanceTabKey);
    setPaymentMethod(entry.paymentMethod as PaymentMethodKey);
    setShowForm(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setPaymentMethod("tunai");
  }

  function exportCsv() {
    const rows = filtered.map((e) => ({
      tanggal: e.occurredAt.slice(0, 10),
      kategori: e.category,
      tipe: e.type,
      deskripsi: e.description,
      referensi: e.reference ?? "",
      metode: e.paymentMethod,
      tunai: e.amountTunai,
      transfer: e.amountTransfer,
      total: e.amount,
    }));
    downloadCsv(
      `keuangan-${tab}-${allMonths ? "semua" : monthFilter}.csv`,
      [
        "tanggal",
        "kategori",
        "tipe",
        "deskripsi",
        "referensi",
        "metode",
        "tunai",
        "transfer",
        "total",
      ],
      rows,
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="tab-scroll">
        <button
          type="button"
          onClick={() => selectTab("ringkasan")}
          className={`tab-chip ${isRingkasan ? "tab-chip-active" : ""}`}
        >
          Ringkasan
        </button>
        {FINANCE_TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => selectTab(item.key)}
              className={`tab-chip ${active ? "tab-chip-active" : ""}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="panel kpi-card kpi-accent-green p-4">
          <p className="relative z-[1] text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Masuk
          </p>
          <p className="relative z-[1] mt-2 text-xl font-bold break-words text-[var(--text)]">
            {formatRp(totalMasuk)}
          </p>
          <p className="relative z-[1] mt-1 text-xs text-[var(--muted)]">
            {isRingkasan ? `Semua jenis · ${monthLabel}` : monthLabel}
          </p>
        </div>
        <div className="panel kpi-card kpi-accent-pink p-4">
          <p className="relative z-[1] text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Keluar
          </p>
          <p className="relative z-[1] mt-2 text-xl font-bold break-words text-[var(--text)]">
            {formatRp(totalKeluar)}
          </p>
          <p className="relative z-[1] mt-1 text-xs text-[var(--muted)]">
            {isRingkasan ? `Semua jenis · ${monthLabel}` : monthLabel}
          </p>
        </div>
        <div className="panel kpi-card kpi-accent-brand p-4">
          <p className="relative z-[1] text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            {isRingkasan ? "Saldo Semua" : "Saldo Tab"}
          </p>
          <p className="relative z-[1] mt-2 text-xl font-bold break-words text-[var(--text)]">
            {formatRp(totalMasuk - totalKeluar)}
          </p>
          <p className="relative z-[1] mt-1 text-xs text-[var(--muted)]">
            {monthLabel}
          </p>
        </div>
      </div>

      {isRingkasan ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categoryStats.map((stat) => (
            <button
              key={stat.key}
              type="button"
              onClick={() => selectTab(stat.key)}
              className={`panel kpi-card kpi-accent-${stat.accent} p-4 text-left transition hover:brightness-[0.98]`}
            >
              <p className="relative z-[1] text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                {stat.label}
              </p>
              <p className="relative z-[1] mt-2 text-xl font-bold break-words text-[var(--text)]">
                {formatRp(stat.saldo)}
              </p>
              <p className="relative z-[1] mt-1 text-xs text-[var(--muted)]">
                {stat.count} transaksi · masuk {formatRp(stat.masuk)} · keluar{" "}
                {formatRp(stat.keluar)}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">
          {filtered.length} transaksi ·{" "}
          {isRingkasan ? "Semua jenis" : tabMeta!.label} · {monthLabel}
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            className="btn btn-ghost w-full sm:w-auto"
            onClick={exportCsv}
          >
            Export CSV
          </button>
          {!isRingkasan && canMutate ? (
            <button
              className="btn btn-primary w-full sm:w-auto"
              onClick={() => (showForm && !editing ? closeForm() : openCreate())}
            >
              {showForm && !editing ? "Tutup Form" : `Tambah ${tabMeta!.label}`}
            </button>
          ) : null}
          {!isRingkasan && !canMutate ? (
            <p className="text-sm text-[var(--muted)]">Mode lihat saja</p>
          ) : null}
          {isRingkasan ? (
            <p className="text-sm text-[var(--muted)]">
              Pilih jenis di atas untuk menambah transaksi
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.4fr]">
        <div>
          <label className="label" htmlFor="finance-month">
            Bulan transaksi
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              id="finance-month"
              className="input"
              type="month"
              value={monthFilter}
              disabled={allMonths}
              onChange={(e) => {
                setAllMonths(false);
                setMonthFilter(e.target.value);
              }}
            />
            <button
              type="button"
              className={`tab-chip shrink-0 ${allMonths ? "tab-chip-active" : ""}`}
              onClick={() => setAllMonths((v) => !v)}
              aria-pressed={allMonths}
            >
              Semua bulan
            </button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="finance-search">
            Cari
          </label>
          <input
            id="finance-search"
            className="input"
            placeholder="Deskripsi, referensi, jenis..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {showForm && canMutate && tabMeta ? (
        <form
          key={editing?.id ?? `new-${tab}`}
          className="panel space-y-5 p-4 md:p-6"
          action={(fd) => {
            setFormError("");
            startTransition(async () => {
              try {
                if (editing) await updateFinanceEntry(fd);
                else await createFinanceEntry(fd);
                closeForm();
              } catch (e) {
                setFormError(
                  e instanceof Error ? e.message : "Gagal menyimpan transaksi",
                );
              }
            });
          }}
        >
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <input
            type="hidden"
            name="category"
            value={editing?.category ?? tab}
          />

          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {editing ? "Edit Transaksi" : `Tambah ${tabMeta.label}`}
            </h3>
            {editing ? <span className="badge">Mode edit</span> : null}
          </div>

          <section className="form-section">
            <h3 className="form-section-title">Detail Transaksi</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Jenis</label>
                <select
                  className="input"
                  name="type"
                  defaultValue={editing?.type ?? tabMeta.typeDefault}
                >
                  <option value="masuk">Masuk</option>
                  <option value="keluar">Keluar</option>
                </select>
              </div>
              <div>
                <label className="label">Metode Bayar</label>
                <select
                  className="input"
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethodKey)
                  }
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Deskripsi</label>
                <input
                  className="input"
                  name="description"
                  required
                  defaultValue={editing?.description ?? ""}
                />
              </div>
              <div>
                <label className="label">Referensi / No. Bukti</label>
                <input
                  className="input"
                  name="reference"
                  placeholder="Opsional"
                  defaultValue={editing?.reference ?? ""}
                />
              </div>
              {paymentMethod !== "gabungan" ? (
                <div>
                  <label className="label">Nominal (Rp)</label>
                  <NumberInput
                    name="amount"
                    required
                    defaultValue={editing?.amount ?? ""}
                  />
                </div>
              ) : null}
            </div>
          </section>

          {paymentMethod === "gabungan" ? (
            <section className="form-section">
              <h3 className="form-section-title">Rincian Gabungan</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Nominal Tunai (Rp)</label>
                  <NumberInput
                    name="amountTunai"
                    required
                    defaultValue={editing?.amountTunai ?? 0}
                  />
                </div>
                <div>
                  <label className="label">Nominal Transfer (Rp)</label>
                  <NumberInput
                    name="amountTransfer"
                    required
                    defaultValue={editing?.amountTransfer ?? 0}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Total otomatis = tunai + transfer
              </p>
            </section>
          ) : null}

          <section className="form-section">
            <h3 className="form-section-title">Tanggal</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Tanggal Transaksi</label>
                <input
                  className="input"
                  name="occurredAt"
                  type="date"
                  defaultValue={toDateInput(editing?.occurredAt) || today}
                  required
                />
              </div>
              <div>
                <label className="label">Tanggal Input</label>
                <input
                  className="input"
                  name="inputAt"
                  type="date"
                  defaultValue={toDateInput(editing?.inputAt) || today}
                  required
                />
              </div>
            </div>
          </section>

          {formError ? (
            <p className="text-sm text-[var(--danger)]">{formError}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-ghost w-full sm:w-auto"
              onClick={closeForm}
            >
              Batal
            </button>
            <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>
              {pending
                ? "Menyimpan..."
                : editing
                  ? "Update Transaksi"
                  : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3 lg:hidden">
        {filtered.map((entry) => (
          <article key={entry.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium leading-snug text-[var(--text)]">
                  {entry.description}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {entry.reference ?? "Tanpa referensi"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {isRingkasan ? (
                  <span className="badge badge-muted">
                    {CATEGORY_LABELS[entry.category as FinanceTabKey] ??
                      entry.category}
                  </span>
                ) : null}
                <span
                  className={
                    entry.type === "masuk" ? "badge" : "badge badge-danger"
                  }
                >
                  {entry.type}
                </span>
              </div>
            </div>

            <p className="mt-3 text-lg font-semibold text-[var(--text)]">
              {formatRp(entry.amount)}
            </p>
            <dl className="detail-grid mt-3">
              <div>
                <dt>Metode</dt>
                <dd>
                  {PAYMENT_METHOD_LABELS[
                    entry.paymentMethod as PaymentMethodKey
                  ] ?? entry.paymentMethod}
                </dd>
              </div>
              <div>
                <dt>Tgl transaksi</dt>
                <dd>{new Date(entry.occurredAt).toLocaleDateString("id-ID")}</dd>
              </div>
              <div>
                <dt>Tgl input</dt>
                <dd>{new Date(entry.inputAt).toLocaleDateString("id-ID")}</dd>
              </div>
              {entry.paymentMethod === "gabungan" ? (
                <div className="sm:col-span-2">
                  <dt>Rincian</dt>
                  <dd>
                    Tunai {formatRp(entry.amountTunai)} · Transfer{" "}
                    {formatRp(entry.amountTransfer)}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {canMutate ? (
                <>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={pending}
                    onClick={() => openEdit(entry)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (
                        !confirm(
                          `Hapus transaksi "${entry.description}"? Tindakan ini tidak bisa dibatalkan.`,
                        )
                      ) {
                        return;
                      }
                      startTransition(() => deleteFinanceEntry(entry.id));
                    }}
                  >
                    Hapus
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            {isRingkasan
              ? "Belum ada transaksi di bulan ini."
              : "Belum ada transaksi di tab ini."}
          </p>
        ) : null}
      </div>

      <div className="panel hidden overflow-hidden lg:block">
        <div className="table-scroll">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Tgl Transaksi</th>
                <th className="px-4 py-3 font-medium">Tgl Input</th>
                {isRingkasan ? (
                  <th className="px-4 py-3 font-medium">Jenis keuangan</th>
                ) : null}
                <th className="px-4 py-3 font-medium">Deskripsi</th>
                <th className="px-4 py-3 font-medium">Metode</th>
                <th className="px-4 py-3 font-medium">Masuk/Keluar</th>
                <th className="px-4 py-3 font-medium">Nominal</th>
                {canMutate ? (
                  <th className="px-4 py-3 font-medium">Aksi</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--border)]/70">
                  <td className="px-4 py-3">
                    {new Date(entry.occurredAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(entry.inputAt).toLocaleDateString("id-ID")}
                  </td>
                  {isRingkasan ? (
                    <td className="px-4 py-3">
                      <span className="badge badge-muted">
                        {CATEGORY_LABELS[entry.category as FinanceTabKey] ??
                          entry.category}
                      </span>
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text)]">
                      {entry.description}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {entry.reference ?? "-"}
                      {entry.paymentMethod === "gabungan"
                        ? ` · Tunai ${formatRp(entry.amountTunai)} / Transfer ${formatRp(entry.amountTransfer)}`
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-muted">
                      {PAYMENT_METHOD_LABELS[
                        entry.paymentMethod as PaymentMethodKey
                      ] ?? entry.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        entry.type === "masuk" ? "badge" : "badge badge-danger"
                      }
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--text)]">
                    {formatRp(entry.amount)}
                  </td>
                  {canMutate ? (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={pending}
                          onClick={() => openEdit(entry)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost"
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (
                              !confirm(
                                `Hapus transaksi "${entry.description}"? Tindakan ini tidak bisa dibatalkan.`,
                              )
                            ) {
                              return;
                            }
                            startTransition(() => deleteFinanceEntry(entry.id));
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
            {isRingkasan
              ? "Belum ada transaksi di bulan ini."
              : "Belum ada transaksi di tab ini."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
