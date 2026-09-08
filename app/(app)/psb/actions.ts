"use server";

import { revalidatePath } from "next/cache";
import {
  createCustomer,
  createPsb,
  deletePsb,
  getCustomer,
  updateCustomer,
  updatePsb,
  type Customer,
} from "@/lib/db";
import type { PsbOrder, PsbStatus } from "@/lib/types";
import { parseThousands } from "@/lib/number-format";
import { requirePsbMutate } from "@/lib/app-user";

function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw || null;
}

function parseAmount(value: FormDataEntryValue | null) {
  return parseThousands(String(value ?? ""));
}

function parsePsbForm(formData: FormData) {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const nik = String(formData.get("nik") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim();
  const packageName = String(formData.get("packageName") ?? "").trim() || null;
  const packagePrice = parseAmount(formData.get("packagePrice"));
  const fee = parseAmount(formData.get("fee"));
  const installDate = parseOptionalDate(formData.get("installDate"));
  const cableDistance =
    String(formData.get("cableDistance") ?? "").trim() || null;
  const wifiSsid = String(formData.get("wifiSsid") ?? "").trim() || null;
  const pppoeUser = String(formData.get("pppoeUser") ?? "").trim() || null;
  const wifiPassword =
    String(formData.get("wifiPassword") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const status = (String(formData.get("status") ?? "lead") ||
    "lead") as PsbStatus;

  if (!customerName || !address) {
    throw new Error("Nama dan alamat wajib diisi");
  }

  return {
    customer_name: customerName,
    nik,
    phone,
    address,
    package_name: packageName,
    package_price: packagePrice,
    fee,
    install_date: installDate,
    cable_distance: cableDistance,
    wifi_ssid: wifiSsid,
    pppoe_user: pppoeUser,
    wifi_password: wifiPassword,
    notes,
    status,
    install_at: installDate ? new Date(installDate).toISOString() : null,
  };
}

function customerPayloadFromPsb(order: PsbOrder) {
  return {
    name: order.customerName,
    nik: order.nik,
    phone: order.phone,
    address: order.address,
    package_name: order.packageName,
    monthly_fee: order.packagePrice || order.fee,
    wifi_ssid: order.wifiSsid,
    pppoe_user: order.pppoeUser,
    status: "aktif" as const,
    installed_at: order.installDate
      ? new Date(order.installDate).toISOString()
      : new Date().toISOString(),
  };
}

/** Buat atau tautkan pelanggan sekali saja saat PSB aktif. */
async function ensureCustomerFromPsb(order: PsbOrder): Promise<Customer> {
  if (order.customerId) {
    const existing = await getCustomer(order.customerId);
    if (existing) {
      return updateCustomer(existing.id, customerPayloadFromPsb(order));
    }
  }

  const customer = await createCustomer(customerPayloadFromPsb(order));
  await updatePsb(order.id, { customer_id: customer.id });
  return customer;
}

export async function createPsbOrder(formData: FormData) {
  await requirePsbMutate();
  const payload = parsePsbForm(formData);

  let order = await createPsb(payload);

  if (order.status === "aktif") {
    await ensureCustomerFromPsb(order);
    order = await updatePsb(order.id, {
      activated_at: new Date().toISOString(),
    });
  }

  revalidatePath("/psb");
  revalidatePath("/pelanggan");
  revalidatePath("/dashboard");
}

export async function updatePsbOrder(formData: FormData) {
  await requirePsbMutate();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID PSB tidak ditemukan");

  const form = parsePsbForm(formData);
  const payload: Record<string, unknown> = { ...form };
  if (form.status === "aktif") {
    payload.activated_at = new Date().toISOString();
  }

  const order = await updatePsb(id, payload);

  if (order.status === "aktif") {
    await ensureCustomerFromPsb(order);
  }

  revalidatePath("/psb");
  revalidatePath("/pelanggan");
  revalidatePath("/dashboard");
}

export async function updatePsbStatus(id: string, status: PsbStatus) {
  await requirePsbMutate();

  const payload: Record<string, unknown> = { status };
  if (status === "survey") payload.survey_at = new Date().toISOString();
  if (status === "install") payload.install_at = new Date().toISOString();
  if (status === "aktif") payload.activated_at = new Date().toISOString();

  const order = await updatePsb(id, payload);

  if (status === "aktif") {
    await ensureCustomerFromPsb(order);
  }

  revalidatePath("/psb");
  revalidatePath("/pelanggan");
  revalidatePath("/dashboard");
}

export async function deletePsbOrder(id: string) {
  await requirePsbMutate();
  await deletePsb(id);
  revalidatePath("/psb");
  revalidatePath("/dashboard");
}
