"use server";

import { revalidatePath } from "next/cache";
import { deleteCustomer, updateCustomer } from "@/lib/db";
import { requireCustomerMutate, requirePsbMutate } from "@/lib/app-user";
import { parseThousands } from "@/lib/number-format";

const STATUSES = new Set(["aktif", "isolir", "putus"]);

export async function updateCustomerStatus(id: string, status: string) {
  await requireCustomerMutate();
  if (!STATUSES.has(status)) throw new Error("Status pelanggan tidak valid");
  await updateCustomer(id, { status });
  revalidatePath("/pelanggan");
  revalidatePath("/dashboard");
}

export async function updateCustomerRecord(formData: FormData) {
  await requireCustomerMutate();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID pelanggan tidak ditemukan");

  const name = String(formData.get("name") ?? "").trim();
  const nik = String(formData.get("nik") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const packageName = String(formData.get("packageName") ?? "").trim() || null;
  const monthlyFee = parseThousands(String(formData.get("monthlyFee") ?? ""));
  const wifiSsid = String(formData.get("wifiSsid") ?? "").trim() || null;
  const pppoeUser = String(formData.get("pppoeUser") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "aktif").trim();

  if (!name) throw new Error("Nama pelanggan wajib diisi");
  if (!STATUSES.has(status)) throw new Error("Status pelanggan tidak valid");

  await updateCustomer(id, {
    name,
    nik,
    phone,
    address,
    package_name: packageName,
    monthly_fee: monthlyFee,
    wifi_ssid: wifiSsid,
    pppoe_user: pppoeUser,
    status,
  });

  revalidatePath("/pelanggan");
  revalidatePath("/dashboard");
}

export async function deleteCustomerRecord(id: string) {
  await requirePsbMutate();
  await deleteCustomer(id);
  revalidatePath("/pelanggan");
  revalidatePath("/dashboard");
}
