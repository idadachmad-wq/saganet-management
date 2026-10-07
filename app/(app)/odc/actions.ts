"use server";

import { revalidatePath } from "next/cache";
import {
  createOdc,
  deleteOdc,
  updateOdc,
  updateOdcPort,
} from "@/lib/db";
import type { OdcPortStatus } from "@/lib/types";
import { requirePsbMutate } from "@/lib/app-user";

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseOdcForm(formData: FormData) {
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
    Math.min(256, Number(formData.get("portCount") ?? 16) || 16),
  );
  const feederOlt = String(formData.get("feederOlt") ?? "").trim() || null;
  const splitterRatio =
    String(formData.get("splitterRatio") ?? "").trim() || null;
  const capacityCores = parseOptionalNumber(formData.get("capacityCores"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!code || !location) {
    throw new Error("Kode ODC dan titik letak wajib diisi");
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
    feeder_olt: feederOlt,
    splitter_ratio: splitterRatio,
    capacity_cores: capacityCores,
    notes,
  };
}

export async function createOdcRecord(formData: FormData) {
  await requirePsbMutate();
  await createOdc(parseOdcForm(formData));
  revalidatePath("/odc");
  revalidatePath("/odp");
}

export async function updateOdcRecord(formData: FormData) {
  await requirePsbMutate();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID ODC tidak ditemukan");
  await updateOdc(id, parseOdcForm(formData));
  revalidatePath("/odc");
  revalidatePath("/odp");
}

export async function deleteOdcRecord(id: string) {
  await requirePsbMutate();
  await deleteOdc(id);
  revalidatePath("/odc");
  revalidatePath("/odp");
}

export async function updateOdcPortRecord(formData: FormData) {
  await requirePsbMutate();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID port tidak ditemukan");

  const statusRaw = String(formData.get("status") ?? "").trim();
  const status =
    statusRaw === "kosong" || statusRaw === "terpakai"
      ? (statusRaw as OdcPortStatus)
      : undefined;
  const labelRaw = formData.get("label");
  const label =
    labelRaw === null || labelRaw === undefined
      ? undefined
      : String(labelRaw).trim() || null;

  await updateOdcPort(id, { status, label });
  revalidatePath("/odc");
}
