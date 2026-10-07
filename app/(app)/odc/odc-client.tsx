"use client";

import { useMemo, useState, useTransition } from "react";
import {
  FIBER_COLORS,
  ODC_PORT_STATUS_LABELS,
  SPLITTER_RATIOS,
} from "@/lib/constants";
import type { Odc, OdcPort, OdcPortStatus } from "@/lib/types";
import {
  createOdcRecord,
  deleteOdcRecord,
  updateOdcPortRecord,
  updateOdcRecord,
} from "./actions";

function portBadge(status: OdcPortStatus) {
  return status === "terpakai" ? "badge badge-warn" : "badge";
}

export function OdcClient({
  odcs,
  canMutate,
}: {
  odcs: Odc[];
  canMutate: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Odc | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return odcs;
    return odcs.filter((o) => {
      const hay = [
        o.code,
        o.name,
        o.location,
        o.cableCode,
        o.tubeColor,
        o.coreColor,
        o.feederOlt,
        o.splitterRatio,
        o.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [odcs, query]);

  const kpi = useMemo(() => {
    const totalPorts = odcs.reduce((s, o) => s + o.ports.length, 0);
    const used = odcs.reduce(
      (s, o) => s + o.ports.filter((p) => p.status === "terpakai").length,
      0,
    );
    return {
      odc: odcs.length,
      ports: totalPorts,
      used,
      free: totalPorts - used,
    };
  }, [odcs]);

  function openCreate() {
    setEditing(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(odc: Odc) {
    setEditing(odc);
    setError("");
    setShowForm(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setError("");
  }

  function savePort(port: OdcPort, status: OdcPortStatus, label: string) {
    const fd = new FormData();
    fd.set("id", port.id);
    fd.set("status", status);
    fd.set("label", label);
    setError("");
    startTransition(async () => {
      try {
        await updateOdcPortRecord(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal mengubah port");
      }
    });
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel kpi-card kpi-accent-brand p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Total ODC
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">{kpi.odc}</p>
        </div>
        <div className="panel kpi-card kpi-accent-cyan p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Total Port
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">
            {kpi.ports}
          </p>
        </div>
        <div className="panel kpi-card kpi-accent-orange p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Port Terpakai
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">{kpi.used}</p>
        </div>
        <div className="panel kpi-card kpi-accent-green p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Port Kosong
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">{kpi.free}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">
          {filtered.length} dari {odcs.length} ODC
        </p>
        {canMutate ? (
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => (showForm && !editing ? closeForm() : openCreate())}
          >
            {showForm && !editing ? "Tutup Form" : "Tambah ODC"}
          </button>
        ) : (
          <p className="text-sm text-[var(--muted)]">Mode lihat saja</p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="odc-search">
          Cari
        </label>
        <input
          id="odc-search"
          className="input"
          placeholder="Kode, lokasi, feeder OLT, splitter..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {showForm && canMutate ? (
        <form
          key={editing?.id ?? "new-odc"}
          className="panel space-y-5 p-4 md:p-6"
          action={(fd) => {
            setError("");
            startTransition(async () => {
              try {
                if (editing) await updateOdcRecord(fd);
                else await createOdcRecord(fd);
                closeForm();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Gagal menyimpan ODC");
              }
            });
          }}
        >
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {editing ? "Edit ODC" : "Tambah ODC"}
            </h3>
            {editing ? <span className="badge">Mode edit</span> : null}
          </div>

          <section className="form-section">
            <h3 className="form-section-title">Identitas & titik letak</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="odc-code">
                  Kode ODC *
                </label>
                <input
                  id="odc-code"
                  className="input"
                  name="code"
                  required
                  defaultValue={editing?.code ?? ""}
                  placeholder="ODC-01"
                />
              </div>
              <div>
                <label className="label" htmlFor="odc-name">
                  Nama / label
                </label>
                <input
                  id="odc-name"
                  className="input"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  placeholder="Opsional"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="odc-location">
                  Titik letak *
                </label>
                <input
                  id="odc-location"
                  className="input"
                  name="location"
                  required
                  defaultValue={editing?.location ?? ""}
                  placeholder="Alamat / patokan"
                />
              </div>
              <div>
                <label className="label" htmlFor="odc-lat">
                  Latitude
                </label>
                <input
                  id="odc-lat"
                  className="input"
                  name="latitude"
                  inputMode="decimal"
                  defaultValue={editing?.latitude ?? ""}
                  placeholder="Opsional"
                />
              </div>
              <div>
                <label className="label" htmlFor="odc-lng">
                  Longitude
                </label>
                <input
                  id="odc-lng"
                  className="input"
                  name="longitude"
                  inputMode="decimal"
                  defaultValue={editing?.longitude ?? ""}
                  placeholder="Opsional"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3 className="form-section-title">Kabel, feeder OLT & splitter</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="odc-cable">
                  Kode / nama kabel
                </label>
                <input
                  id="odc-cable"
                  className="input"
                  name="cableCode"
                  defaultValue={editing?.cableCode ?? ""}
                  placeholder="Feeder / backbone"
                />
              </div>
              <div>
                <label className="label" htmlFor="odc-tube">
                  Warna tube
                </label>
                <select
                  id="odc-tube"
                  className="input"
                  name="tubeColor"
                  defaultValue={editing?.tubeColor ?? ""}
                >
                  <option value="">— Pilih —</option>
                  {FIBER_COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="odc-core">
                  Warna core
                </label>
                <select
                  id="odc-core"
                  className="input"
                  name="coreColor"
                  defaultValue={editing?.coreColor ?? ""}
                >
                  <option value="">— Pilih —</option>
                  {FIBER_COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="odc-feeder">
                  Feeder / port OLT
                </label>
                <input
                  id="odc-feeder"
                  className="input"
                  name="feederOlt"
                  defaultValue={editing?.feederOlt ?? ""}
                  placeholder="Mis. OLT-1 / PON-0/1/1"
                />
              </div>
              <div>
                <label className="label" htmlFor="odc-splitter">
                  Splitter ratio
                </label>
                <select
                  id="odc-splitter"
                  className="input"
                  name="splitterRatio"
                  defaultValue={editing?.splitterRatio ?? ""}
                >
                  <option value="">— Pilih —</option>
                  {SPLITTER_RATIOS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="odc-capacity">
                  Kapasitas core
                </label>
                <input
                  id="odc-capacity"
                  className="input"
                  name="capacityCores"
                  type="number"
                  min={1}
                  defaultValue={editing?.capacityCores ?? ""}
                  placeholder="Opsional"
                />
              </div>
              <div>
                <label className="label" htmlFor="odc-ports">
                  Jumlah port
                </label>
                <input
                  id="odc-ports"
                  className="input"
                  name="portCount"
                  type="number"
                  min={1}
                  max={256}
                  required
                  defaultValue={editing?.portCount ?? 16}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="odc-notes">
                  Catatan
                </label>
                <input
                  id="odc-notes"
                  className="input"
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                  placeholder="Opsional"
                />
              </div>
            </div>
          </section>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-ghost w-full sm:w-auto"
              onClick={closeForm}
            >
              Batal
            </button>
            <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>
              {pending ? "Menyimpan..." : editing ? "Update ODC" : "Simpan ODC"}
            </button>
          </div>
        </form>
      ) : null}

      {!showForm && error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          Belum ada data ODC. Jalankan migrasi SQL di Supabase lalu tambah ODC.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((odc) => {
            const used = odc.ports.filter((p) => p.status === "terpakai").length;
            const open = expanded === odc.id;
            return (
              <article key={odc.id} className="panel overflow-hidden">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--text)]">
                        {odc.code}
                      </h3>
                      {odc.name ? (
                        <span className="text-sm text-[var(--muted)]">
                          {odc.name}
                        </span>
                      ) : null}
                      <span className="badge badge-muted">
                        {used}/{odc.ports.length || odc.portCount} port
                      </span>
                      {odc.splitterRatio ? (
                        <span className="badge">{odc.splitterRatio}</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text)]">
                      {odc.location}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Feeder {odc.feederOlt || "—"} · Kabel {odc.cableCode || "—"} ·
                      Tube {odc.tubeColor || "—"} · Core {odc.coreColor || "—"}
                      {odc.capacityCores != null
                        ? ` · ${odc.capacityCores} core`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setExpanded(open ? null : odc.id)}
                    >
                      {open ? "Tutup port" : "Kelola port"}
                    </button>
                    {canMutate ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={pending}
                          onClick={() => openEdit(odc)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={pending}
                          onClick={() => {
                            if (
                              !confirm(
                                `Hapus ODC ${odc.code}? Semua port ikut terhapus. ODP terkait akan lepas tautan.`,
                              )
                            ) {
                              return;
                            }
                            startTransition(async () => {
                              try {
                                await deleteOdcRecord(odc.id);
                              } catch (e) {
                                setError(
                                  e instanceof Error
                                    ? e.message
                                    : "Gagal menghapus ODC",
                                );
                              }
                            });
                          }}
                        >
                          Hapus
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {open ? (
                  <div className="border-t border-[var(--border)] bg-[var(--bg-soft)] p-4">
                    <p className="mb-3 text-sm text-[var(--muted)]">
                      Status dan label tiap port ODC.
                    </p>
                    {odc.ports.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">
                        Belum ada port. Edit ODC dan set jumlah port.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {odc.ports.map((port) => (
                          <PortRow
                            key={`${port.id}-${port.updatedAt}`}
                            port={port}
                            canMutate={canMutate}
                            pending={pending}
                            onSave={savePort}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PortRow({
  port,
  canMutate,
  pending,
  onSave,
}: {
  port: OdcPort;
  canMutate: boolean;
  pending: boolean;
  onSave: (port: OdcPort, status: OdcPortStatus, label: string) => void;
}) {
  const [status, setStatus] = useState<OdcPortStatus>(port.status);
  const [label, setLabel] = useState(port.label ?? "");

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[var(--text)]">
          Port {port.portNumber}
        </span>
        <span className={portBadge(status)}>
          {ODC_PORT_STATUS_LABELS[status] ?? status}
        </span>
      </div>
      {canMutate ? (
        <div className="mt-2 space-y-2">
          <select
            className="input"
            value={status}
            disabled={pending}
            onChange={(e) => setStatus(e.target.value as OdcPortStatus)}
          >
            <option value="kosong">Kosong</option>
            <option value="terpakai">Terpakai</option>
          </select>
          <input
            className="input"
            placeholder="Label / tujuan"
            value={label}
            disabled={pending}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={pending}
            onClick={() => onSave(port, status, label)}
          >
            Simpan port
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {port.label || "Tanpa label"}
        </p>
      )}
    </div>
  );
}
