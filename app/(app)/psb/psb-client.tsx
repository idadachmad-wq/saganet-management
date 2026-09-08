"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createPsbOrder,
  updatePsbOrder,
  updatePsbStatus,
  deletePsbOrder,
} from "./actions";
import { PSB_STATUS_LABELS } from "@/lib/constants";
import { formatRp } from "@/lib/bagi-hasil";
import { downloadCsv } from "@/lib/export-csv";
import type { PsbOrder } from "@/lib/types";
import { NumberInput } from "@/components/number-input";
import { PsbMonthlyChart } from "@/components/psb/psb-monthly-chart-lazy";
import { format, startOfMonth, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";

const STATUSES = ["lead", "survey", "install", "aktif", "batal"] as const;

function statusBadge(status: string) {
  if (status === "aktif") return "badge";
  if (status === "batal") return "badge badge-danger";
  if (status === "install" || status === "survey") return "badge badge-warn";
  return "badge badge-muted";
}

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID");
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function installDateOf(order: PsbOrder) {
  const raw = order.installDate || order.installAt || order.activatedAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function PsbClient({
  orders,
  canMutate,
}: {
  orders: PsbOrder[];
  canMutate: boolean;
}) {
  const [editing, setEditing] = useState<PsbOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        order.customerName,
        order.nik,
        order.phone,
        order.address,
        order.wifiSsid,
        order.pppoeUser,
        order.packageName,
        order.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, query, statusFilter]);

  const summary = useMemo(() => {
    const aktif = orders.filter((o) => o.status === "aktif");
    const installed = orders.filter(
      (o) =>
        o.status === "aktif" ||
        o.status === "install" ||
        Boolean(installDateOf(o)),
    );
    const estLangganan = aktif.reduce((sum, o) => sum + (o.packagePrice || 0), 0);
    const omzetPemasangan = installed.reduce((sum, o) => sum + (o.fee || 0), 0);
    const terpasang = aktif.length;

    const now = new Date();
    const byKey = new Map<
      string,
      {
        key: string;
        label: string;
        jumlah: number;
        langganan: number;
        pemasangan: number;
      }
    >();

    for (const order of orders) {
      if (order.status === "batal") continue;
      const date = installDateOf(order);
      if (!date) continue;
      const key = format(date, "yyyy-MM");
      const existing = byKey.get(key);
      if (existing) {
        existing.jumlah += 1;
        existing.langganan += order.packagePrice || 0;
        existing.pemasangan += order.fee || 0;
      } else {
        byKey.set(key, {
          key,
          label: format(date, "MMM yy", { locale: localeId }),
          jumlah: 1,
          langganan: order.packagePrice || 0,
          pemasangan: order.fee || 0,
        });
      }
    }

    const withInstalls = [...byKey.values()]
      .filter((m) => m.jumlah > 0)
      .sort((a, b) => a.key.localeCompare(b.key));

    let chart = withInstalls.slice(-12);

    // Jika belum ada tanggal pasang, tampilkan 6 bulan terakhir (kosong)
    if (chart.length === 0) {
      chart = Array.from({ length: 6 }, (_, idx) => {
        const d = startOfMonth(subMonths(now, 5 - idx));
        return {
          key: format(d, "yyyy-MM"),
          label: format(d, "MMM yy", { locale: localeId }),
          jumlah: 0,
          langganan: 0,
          pemasangan: 0,
        };
      });
    }

    return {
      estLangganan,
      omzetPemasangan,
      terpasang,
      chart,
      hasInstallMonths: withInstalls.length > 0,
    };
  }, [orders]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(order: PsbOrder) {
    setEditing(order);
    setShowForm(true);
    setExpanded(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">
            {filteredOrders.length} dari {orders.length} data PSB
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            className="btn btn-ghost w-full sm:w-auto"
            onClick={() => {
              downloadCsv(
                `psb-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  "nama",
                  "nik",
                  "telepon",
                  "alamat",
                  "paket",
                  "harga_paket",
                  "fee",
                  "tgl_pasang",
                  "jarak_kabel",
                  "ssid",
                  "pppoe",
                  "status",
                  "catatan",
                  "isp",
                ],
                filteredOrders.map((o) => ({
                  nama: o.customerName,
                  nik: o.nik ?? "",
                  telepon: o.phone ?? "",
                  alamat: o.address,
                  paket: o.packageName ?? "",
                  harga_paket: o.packagePrice,
                  fee: o.fee,
                  tgl_pasang: o.installDate
                    ? String(o.installDate).slice(0, 10)
                    : "",
                  jarak_kabel: o.cableDistance ?? "",
                  ssid: o.wifiSsid ?? "",
                  pppoe: o.pppoeUser ?? "",
                  status: PSB_STATUS_LABELS[o.status] ?? o.status,
                  catatan: o.notes ?? "",
                  isp: o.ispPartner?.name ?? "",
                })),
              );
            }}
          >
            Export CSV
          </button>
          {canMutate ? (
            <button
              className="btn btn-primary w-full sm:w-auto"
              onClick={() => (showForm && !editing ? closeForm() : openCreate())}
            >
              {showForm && !editing ? "Tutup Form" : "Tambah PSB"}
            </button>
          ) : (
            <p className="text-sm text-[var(--muted)]">Mode lihat saja</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel kpi-card kpi-accent-green p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Est. Omzet Langganan
          </p>
          <p className="mt-2 text-xl font-bold break-words text-[var(--text)] sm:text-2xl">
            {formatRp(summary.estLangganan)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Total harga paket status aktif / bulan
          </p>
        </div>
        <div className="panel kpi-card kpi-accent-cyan p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Omzet Biaya Pemasangan
          </p>
          <p className="mt-2 text-xl font-bold break-words text-[var(--text)] sm:text-2xl">
            {formatRp(summary.omzetPemasangan)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Total fee PSB yang sudah/akan terpasang
          </p>
        </div>
        <div className="panel kpi-card kpi-accent-orange p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            PSB Terpasang
          </p>
          <p className="mt-2 text-xl font-bold break-words text-[var(--text)] sm:text-2xl">
            {summary.terpasang}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Jumlah PSB berstatus aktif
          </p>
        </div>
      </div>

      <div className="panel p-4 md:p-5">
        <div className="mb-3 sm:mb-4">
          <h3 className="font-semibold text-[var(--text)]">
            Rekap PSB per Bulan Pemasangan
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Per bulan tanggal pasang · maks. 12 bulan
          </p>
        </div>
        {!summary.hasInstallMonths ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-8 text-center text-sm text-[var(--muted)]">
            Belum ada PSB dengan tanggal pemasangan untuk ditampilkan.
          </p>
        ) : (
          <PsbMonthlyChart data={summary.chart} />
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="psb-search">
            Cari
          </label>
          <input
            id="psb-search"
            className="input"
            placeholder="Nama, NIK, SSID, telepon, alamat..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-full lg:w-48">
          <label className="label" htmlFor="psb-status">
            Status
          </label>
          <select
            id="psb-status"
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {PSB_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && canMutate ? (
        <form
          key={editing?.id ?? "new"}
          className="panel space-y-5 p-4 md:p-6"
          action={(fd) => {
            setFormError("");
            startTransition(async () => {
              try {
                if (editing) await updatePsbOrder(fd);
                else await createPsbOrder(fd);
                closeForm();
              } catch (e) {
                setFormError(
                  e instanceof Error ? e.message : "Gagal menyimpan PSB",
                );
              }
            });
          }}
        >
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {editing ? "Edit Data PSB" : "Tambah PSB Baru"}
            </h3>
            {editing ? <span className="badge">Mode edit</span> : null}
          </div>

          {formError ? (
            <p className="text-sm text-[var(--danger)]">{formError}</p>
          ) : null}

          <section className="form-section">
            <h3 className="form-section-title">Data Pelanggan</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Nama Pelanggan</label>
                <input
                  className="input"
                  name="customerName"
                  required
                  defaultValue={editing?.customerName ?? ""}
                />
              </div>
              <div>
                <label className="label">No. NIK</label>
                <input
                  className="input"
                  name="nik"
                  inputMode="numeric"
                  placeholder="16 digit"
                  defaultValue={editing?.nik ?? ""}
                />
              </div>
              <div>
                <label className="label">No. HP</label>
                <input
                  className="input"
                  name="phone"
                  inputMode="tel"
                  defaultValue={editing?.phone ?? ""}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  name="status"
                  defaultValue={editing?.status ?? "lead"}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PSB_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Alamat</label>
                <textarea
                  className="input min-h-[72px] resize-y"
                  name="address"
                  required
                  defaultValue={editing?.address ?? ""}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3 className="form-section-title">Paket & Pemasangan</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label">Nama Paket</label>
                <input
                  className="input"
                  name="packageName"
                  placeholder="20 Mbps"
                  defaultValue={editing?.packageName ?? ""}
                />
              </div>
              <div>
                <label className="label">Harga Paket (Rp/bulan)</label>
                <NumberInput
                  name="packagePrice"
                  defaultValue={editing?.packagePrice ?? 0}
                />
              </div>
              <div>
                <label className="label">Biaya PSB</label>
                <NumberInput name="fee" defaultValue={editing?.fee ?? 0} />
              </div>
              <div>
                <label className="label">Tanggal Pemasangan</label>
                <input
                  className="input"
                  name="installDate"
                  type="date"
                  defaultValue={toDateInput(editing?.installDate)}
                />
              </div>
              <div>
                <label className="label">Jarak Kabel</label>
                <input
                  className="input"
                  name="cableDistance"
                  placeholder="contoh: 85 meter"
                  defaultValue={editing?.cableDistance ?? ""}
                />
              </div>
              <div>
                <label className="label">Catatan</label>
                <input
                  className="input"
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3 className="form-section-title">Kredensial WiFi / PPPoE</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label">Nama SSID WiFi</label>
                <input
                  className="input"
                  name="wifiSsid"
                  placeholder="SaGaNet-Customer"
                  defaultValue={editing?.wifiSsid ?? ""}
                />
              </div>
              <div>
                <label className="label">User PPPoE</label>
                <input
                  className="input"
                  name="pppoeUser"
                  defaultValue={editing?.pppoeUser ?? ""}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="label">Password WiFi</label>
                <input
                  className="input"
                  name="wifiPassword"
                  type="text"
                  autoComplete="off"
                  defaultValue={editing?.wifiPassword ?? ""}
                />
              </div>
            </div>
          </section>

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
                  ? "Update PSB"
                  : "Simpan PSB"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="panel p-4 md:p-5 lg:hidden">
        <h3 className="font-semibold text-[var(--text)]">Daftar PSB</h3>
        <div className="mt-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-8 text-center text-sm text-[var(--muted)]">
              Tidak ada PSB yang cocok dengan filter.
            </p>
          ) : (
            filteredOrders.map((order) => {
              const isOpen = expanded === order.id;
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--text)]">
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                        {order.packageName ?? "Tanpa paket"} ·{" "}
                        {formatRp(order.packagePrice || order.fee)}
                      </p>
                    </div>
                    <span className={`${statusBadge(order.status)} shrink-0`}>
                      {PSB_STATUS_LABELS[order.status]}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="space-y-3 border-t border-[var(--border)] px-3 py-3">
                      {canMutate ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="input min-w-0 flex-1"
                            value={order.status}
                            disabled={pending}
                            onChange={(e) => {
                              const value = e.target
                                .value as (typeof STATUSES)[number];
                              startTransition(() =>
                                updatePsbStatus(order.id, value),
                              );
                            }}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {PSB_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="text-sm font-semibold text-[var(--brand)]"
                            disabled={pending}
                            onClick={() => openEdit(order)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-sm font-semibold text-[var(--danger)]"
                            disabled={pending}
                            onClick={() => {
                              if (
                                !confirm(
                                  `Hapus PSB ${order.customerName}? Tindakan ini tidak bisa dibatalkan.`,
                                )
                              ) {
                                return;
                              }
                              startTransition(() => deletePsbOrder(order.id));
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      ) : null}

                      <dl className="detail-grid">
                        <div>
                          <dt>Alamat</dt>
                          <dd>{order.address || "-"}</dd>
                        </div>
                        <div>
                          <dt>NIK</dt>
                          <dd>{order.nik || "-"}</dd>
                        </div>
                        <div>
                          <dt>HP</dt>
                          <dd>{order.phone || "-"}</dd>
                        </div>
                        <div>
                          <dt>Harga paket</dt>
                          <dd>{formatRp(order.packagePrice)}</dd>
                        </div>
                        <div>
                          <dt>Biaya PSB</dt>
                          <dd>{formatRp(order.fee)}</dd>
                        </div>
                        <div>
                          <dt>Tgl pasang</dt>
                          <dd>{formatDate(order.installDate)}</dd>
                        </div>
                        <div>
                          <dt>SSID</dt>
                          <dd>{order.wifiSsid || "-"}</dd>
                        </div>
                        <div>
                          <dt>PPPoE</dt>
                          <dd>{order.pppoeUser || "-"}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel hidden overflow-hidden lg:block">
        <div className="table-scroll">
          <table className="min-w-[1040px] w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Pelanggan</th>
                <th className="px-4 py-3 font-medium">NIK</th>
                <th className="px-4 py-3 font-medium">Paket</th>
                <th className="px-4 py-3 font-medium">Tgl Pasang</th>
                <th className="px-4 py-3 font-medium">SSID / PPPoE</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canMutate ? (
                  <th className="px-4 py-3 font-medium">Aksi</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[var(--border)]/70 align-top"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text)]">
                      {order.customerName}
                    </div>
                    <div className="mt-1 max-w-[220px] text-xs text-[var(--muted)]">
                      {order.address}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      Kabel: {order.cableDistance || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {order.nik || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div>{order.packageName ?? "-"}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {formatRp(order.packagePrice)} · PSB {formatRp(order.fee)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(order.installDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">SSID: {order.wifiSsid || "-"}</div>
                    <div className="text-xs text-[var(--muted)]">
                      PPPoE: {order.pppoeUser || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(order.status)}>
                      {PSB_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  {canMutate ? (
                    <td className="px-4 py-3">
                      <div className="flex min-w-[260px] flex-wrap gap-2">
                        <select
                          className="input max-w-[130px]"
                          defaultValue={order.status}
                          disabled={pending}
                          onChange={(e) => {
                            const value = e.target
                              .value as (typeof STATUSES)[number];
                            startTransition(() =>
                              updatePsbStatus(order.id, value),
                            );
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {PSB_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn btn-primary shrink-0"
                          type="button"
                          disabled={pending}
                          onClick={() => openEdit(order)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost shrink-0"
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (
                              !confirm(
                                `Hapus PSB ${order.customerName}? Tindakan ini tidak bisa dibatalkan.`,
                              )
                            ) {
                              return;
                            }
                            startTransition(() => deletePsbOrder(order.id));
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
      </div>
    </div>
  );
}
