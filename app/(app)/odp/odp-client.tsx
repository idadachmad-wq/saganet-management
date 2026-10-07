"use client";

import { useMemo, useState, useTransition } from "react";
import {
  FIBER_COLORS,
  ODP_PORT_STATUS_LABELS,
} from "@/lib/constants";
import type { Odp, OdpPort, OdpPortStatus } from "@/lib/types";
import {
  createOdpRecord,
  deleteOdpRecord,
  updateOdpPortRecord,
  updateOdpRecord,
} from "./actions";

function portBadge(status: OdpPortStatus) {
  return status === "terpakai" ? "badge badge-warn" : "badge";
}

export function OdpClient({
  odps,
  canMutate,
}: {
  odps: Odp[];
  canMutate: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Odp | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return odps;
    return odps.filter((o) => {
      const hay = [
        o.code,
        o.name,
        o.location,
        o.cableCode,
        o.tubeColor,
        o.coreColor,
        o.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [odps, query]);

  const kpi = useMemo(() => {
    const totalPorts = odps.reduce((s, o) => s + o.ports.length, 0);
    const used = odps.reduce(
      (s, o) => s + o.ports.filter((p) => p.status === "terpakai").length,
      0,
    );
    return {
      odp: odps.length,
      ports: totalPorts,
      used,
      free: totalPorts - used,
    };
  }, [odps]);

  function openCreate() {
    setEditing(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(odp: Odp) {
    setEditing(odp);
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

  function savePort(port: OdpPort, status: OdpPortStatus, label: string) {
    const fd = new FormData();
    fd.set("id", port.id);
    fd.set("status", status);
    fd.set("label", label);
    setError("");
    startTransition(async () => {
      try {
        await updateOdpPortRecord(fd);
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
            Total ODP
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">{kpi.odp}</p>
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
          {filtered.length} dari {odps.length} ODP
        </p>
        {canMutate ? (
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => (showForm && !editing ? closeForm() : openCreate())}
          >
            {showForm && !editing ? "Tutup Form" : "Tambah ODP"}
          </button>
        ) : (
          <p className="text-sm text-[var(--muted)]">Mode lihat saja</p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="odp-search">
          Cari
        </label>
        <input
          id="odp-search"
          className="input"
          placeholder="Kode, lokasi, kabel, warna..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {showForm && canMutate ? (
        <form
          key={editing?.id ?? "new-odp"}
          className="panel space-y-5 p-4 md:p-6"
          action={(fd) => {
            setError("");
            startTransition(async () => {
              try {
                if (editing) await updateOdpRecord(fd);
                else await createOdpRecord(fd);
                closeForm();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Gagal menyimpan ODP");
              }
            });
          }}
        >
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {editing ? "Edit ODP" : "Tambah ODP"}
            </h3>
            {editing ? <span className="badge">Mode edit</span> : null}
          </div>

          <section className="form-section">
            <h3 className="form-section-title">Identitas & titik letak</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="odp-code">
                  Kode ODP *
                </label>
                <input
                  id="odp-code"
                  className="input"
                  name="code"
                  required
                  defaultValue={editing?.code ?? ""}
                  placeholder="ODP-01"
                />
              </div>
              <div>
                <label className="label" htmlFor="odp-name">
                  Nama / label
                </label>
                <input
                  id="odp-name"
                  className="input"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  placeholder="Opsional"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="odp-location">
                  Titik letak *
                </label>
                <input
                  id="odp-location"
                  className="input"
                  name="location"
                  required
                  defaultValue={editing?.location ?? ""}
                  placeholder="Alamat / patokan"
                />
              </div>
              <div>
                <label className="label" htmlFor="odp-lat">
                  Latitude
                </label>
                <input
                  id="odp-lat"
                  className="input"
                  name="latitude"
                  inputMode="decimal"
                  defaultValue={editing?.latitude ?? ""}
                  placeholder="Opsional"
                />
              </div>
              <div>
                <label className="label" htmlFor="odp-lng">
                  Longitude
                </label>
                <input
                  id="odp-lng"
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
            <h3 className="form-section-title">Kabel & warna core</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="odp-cable">
                  Kode / nama kabel
                </label>
                <input
                  id="odp-cable"
                  className="input"
                  name="cableCode"
                  defaultValue={editing?.cableCode ?? ""}
                  placeholder="Feeder / distribusi"
                />
              </div>
              <div>
                <label className="label" htmlFor="odp-tube">
                  Warna tube
                </label>
                <select
                  id="odp-tube"
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
                <label className="label" htmlFor="odp-core">
                  Warna core
                </label>
                <select
                  id="odp-core"
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
                <label className="label" htmlFor="odp-ports">
                  Jumlah port
                </label>
                <input
                  id="odp-ports"
                  className="input"
                  name="portCount"
                  type="number"
                  min={1}
                  max={128}
                  required
                  defaultValue={editing?.portCount ?? 8}
                />
              </div>
              <div>
                <label className="label" htmlFor="odp-notes">
                  Catatan
                </label>
                <input
                  id="odp-notes"
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
              {pending ? "Menyimpan..." : editing ? "Update ODP" : "Simpan ODP"}
            </button>
          </div>
        </form>
      ) : null}

      {!showForm && error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          Belum ada data ODP. Jalankan migrasi SQL di Supabase lalu tambah ODP.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((odp) => {
            const used = odp.ports.filter((p) => p.status === "terpakai").length;
            const open = expanded === odp.id;
            return (
              <article key={odp.id} className="panel overflow-hidden">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--text)]">
                        {odp.code}
                      </h3>
                      {odp.name ? (
                        <span className="text-sm text-[var(--muted)]">
                          {odp.name}
                        </span>
                      ) : null}
                      <span className="badge badge-muted">
                        {used}/{odp.ports.length || odp.portCount} port
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text)]">
                      {odp.location}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Kabel {odp.cableCode || "—"} · Tube {odp.tubeColor || "—"} ·
                      Core {odp.coreColor || "—"}
                      {odp.latitude != null && odp.longitude != null
                        ? ` · ${odp.latitude}, ${odp.longitude}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setExpanded(open ? null : odp.id)}
                    >
                      {open ? "Tutup port" : "Kelola port"}
                    </button>
                    {canMutate ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={pending}
                          onClick={() => openEdit(odp)}
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
                                `Hapus ODP ${odp.code}? Semua port ikut terhapus.`,
                              )
                            ) {
                              return;
                            }
                            startTransition(async () => {
                              try {
                                await deleteOdpRecord(odp.id);
                              } catch (e) {
                                setError(
                                  e instanceof Error
                                    ? e.message
                                    : "Gagal menghapus ODP",
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
                      Status dan label tiap port. Label bebas (mis. nama pelanggan).
                    </p>
                    {odp.ports.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">
                        Belum ada port. Edit ODP dan set jumlah port.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {odp.ports.map((port) => (
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
  port: OdpPort;
  canMutate: boolean;
  pending: boolean;
  onSave: (port: OdpPort, status: OdpPortStatus, label: string) => void;
}) {
  const [status, setStatus] = useState<OdpPortStatus>(port.status);
  const [label, setLabel] = useState(port.label ?? "");

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[var(--text)]">
          Port {port.portNumber}
        </span>
        <span className={portBadge(status)}>
          {ODP_PORT_STATUS_LABELS[status] ?? status}
        </span>
      </div>
      {canMutate ? (
        <div className="mt-2 space-y-2">
          <select
            className="input"
            value={status}
            disabled={pending}
            onChange={(e) => setStatus(e.target.value as OdpPortStatus)}
          >
            <option value="kosong">Kosong</option>
            <option value="terpakai">Terpakai</option>
          </select>
          <input
            className="input"
            placeholder="Label / pelanggan"
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
