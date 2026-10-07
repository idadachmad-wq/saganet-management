"use server";

import { revalidatePath } from "next/cache";
import {
  createOdp,
  deleteOdp,
  updateOdp,
  updateOdpPort,
} from "@/lib/db";
import type { OdpPortStatus } from "@/lib/types";
import { requirePsbMutate } from "@/lib/app-user";

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseOdpForm(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim();
  const latitude = parseOptionalNumber(formData.get("latitude"));
  const longitude = parseOptionalNumber(formData.get("longitude"));
  const cableCode = String(formData.get("cableCode") ?? "").trim() || null;
  const tubeColor = String(formData.get("tubeColor") ?? "").trim() || null;
  const coreColor = String(formData.get("coreColor") ?? "").trim() || null;
  const portCount = Math.max(
    1,
    Math.min(128, Number(formData.get("portCount") ?? 8) || 8),
  );
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!code || !location) {
    throw new Error("Kode ODP dan titik letak wajib diisi");
  }

  return {
    code,
    name,
    location,
    latitude,
    longitude,
    cable_code: cableCode,
    tube_color: tubeColor,
    core_color: coreColor,
    port_count: portCount,
    notes,
  };
}

export async function createOdpRecord(formData: FormData) {
  await requirePsbMutate();
  await createOdp(parseOdpForm(formData));
  revalidatePath("/odp");
}

export async function updateOdpRecord(formData: FormData) {
  await requirePsbMutate();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID ODP tidak ditemukan");
  await updateOdp(id, parseOdpForm(formData));
  revalidatePath("/odp");
}

export async function deleteOdpRecord(id: string) {
  await requirePsbMutate();
  await deleteOdp(id);
  revalidatePath("/odp");
}

export async function updateOdpPortRecord(formData: FormData) {
  await requirePsbMutate();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID port tidak ditemukan");

  const statusRaw = String(formData.get("status") ?? "").trim();
  const status =
    statusRaw === "kosong" || statusRaw === "terpakai"
      ? (statusRaw as OdpPortStatus)
      : undefined;
  const labelRaw = formData.get("label");
  const label =
    labelRaw === null || labelRaw === undefined
      ? undefined
      : String(labelRaw).trim() || null;

  await updateOdpPort(id, { status, label });
  revalidatePath("/odp");
}
