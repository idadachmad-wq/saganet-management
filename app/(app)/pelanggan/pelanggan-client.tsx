"use client";

import { useMemo, useState, useTransition } from "react";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants";
import { formatRp } from "@/lib/bagi-hasil";
import type { Customer } from "@/lib/types";
import { NumberInput } from "@/components/number-input";
import {
  deleteCustomerRecord,
  updateCustomerRecord,
  updateCustomerStatus,
} from "./actions";

const STATUSES = ["aktif", "isolir", "putus"] as const;

function statusBadge(status: string) {
  if (status === "aktif") return "badge";
  if (status === "isolir") return "badge badge-warn";
  return "badge badge-danger";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID");
}

export function PelangganClient({
  customers,
  canMutate,
}: {
  customers: Customer[];
  canMutate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        c.name,
        c.nik,
        c.phone,
        c.address,
        c.wifiSsid,
        c.pppoeUser,
        c.packageName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [customers, query, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: customers.length,
      aktif: customers.filter((c) => c.status === "aktif").length,
      isolir: customers.filter((c) => c.status === "isolir").length,
      putus: customers.filter((c) => c.status === "putus").length,
    };
  }, [customers]);

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel kpi-card kpi-accent-green p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Aktif
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">
            {counts.aktif}
          </p>
        </div>
        <div className="panel kpi-card kpi-accent-orange p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Isolir
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">
            {counts.isolir}
          </p>
        </div>
        <div className="panel kpi-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Putus
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">
            {counts.putus}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="customer-search">
            Cari
          </label>
          <input
            id="customer-search"
            className="input"
            placeholder="Nama, NIK, SSID, telepon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-full lg:w-48">
          <label className="label" htmlFor="customer-status">
            Status
          </label>
          <select
            id="customer-status"
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua ({counts.all})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {CUSTOMER_STATUS_LABELS[s]} ({counts[s]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {editing && canMutate ? (
        <form
          className="panel space-y-4 p-4 md:p-6"
          action={(fd) => {
            setError("");
            startTransition(async () => {
              try {
                await updateCustomerRecord(fd);
                setEditing(null);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Gagal menyimpan pelanggan",
                );
              }
            });
          }}
        >
          <input type="hidden" name="id" value={editing.id} />
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Edit Pelanggan
            </h3>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEditing(null)}
            >
              Batal
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input
                className="input"
                name="name"
                required
                defaultValue={editing.name}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                name="status"
                defaultValue={editing.status}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CUSTOMER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">NIK</label>
              <input className="input" name="nik" defaultValue={editing.nik ?? ""} />
            </div>
            <div>
              <label className="label">Telepon</label>
              <input
                className="input"
                name="phone"
                defaultValue={editing.phone ?? ""}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Alamat</label>
              <input
                className="input"
                name="address"
                defaultValue={editing.address ?? ""}
              />
            </div>
            <div>
              <label className="label">Paket</label>
              <input
                className="input"
                name="packageName"
                defaultValue={editing.packageName ?? ""}
              />
            </div>
            <div>
              <label className="label">Biaya bulanan</label>
              <NumberInput name="monthlyFee" defaultValue={editing.monthlyFee} />
            </div>
            <div>
              <label className="label">SSID</label>
              <input
                className="input"
                name="wifiSsid"
                defaultValue={editing.wifiSsid ?? ""}
              />
            </div>
            <div>
              <label className="label">PPPoE</label>
              <input
                className="input"
                name="pppoeUser"
                defaultValue={editing.pppoeUser ?? ""}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      ) : null}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-8 text-center text-sm text-[var(--muted)]">
            Tidak ada pelanggan yang cocok dengan filter.
          </p>
        ) : (
          filtered.map((customer) => (
            <div
              key={customer.id}
              className="panel space-y-3 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--text)]">
                      {customer.name}
                    </h3>
                    <span className={statusBadge(customer.status)}>
                      {CUSTOMER_STATUS_LABELS[customer.status] ?? customer.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {customer.address || "Alamat belum diisi"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Paket {customer.packageName || "-"} ·{" "}
                    {formatRp(customer.monthlyFee)} · SSID{" "}
                    {customer.wifiSsid || "-"} · Pasang{" "}
                    {formatDate(customer.installedAt)}
                  </p>
                </div>
                {canMutate ? (
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="btn btn-ghost text-xs"
                        disabled={pending || customer.status === s}
                        onClick={() => {
                          startTransition(async () => {
                            await updateCustomerStatus(customer.id, s);
                          });
                        }}
                      >
                        {CUSTOMER_STATUS_LABELS[s]}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn btn-ghost text-xs"
                      disabled={pending}
                      onClick={() => setEditing(customer)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost text-xs text-[var(--danger)]"
                      disabled={pending}
                      onClick={() => {
                        if (
                          !confirm(
                            `Hapus pelanggan ${customer.name}? Tindakan ini tidak bisa dibatalkan.`,
                          )
                        ) {
                          return;
                        }
                        startTransition(async () => {
                          await deleteCustomerRecord(customer.id);
                        });
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
