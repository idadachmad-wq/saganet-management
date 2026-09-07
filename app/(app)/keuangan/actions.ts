"use server";

import { revalidatePath } from "next/cache";
import { createFinance, deleteFinance, updateFinance } from "@/lib/db";
import type { FinanceCategory, FinanceType, PaymentMethod } from "@/lib/types";
import { parseThousands } from "@/lib/number-format";
import { requireFinanceMutate } from "@/lib/app-user";

function parseDate(value: FormDataEntryValue | null, fallback = new Date()) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback.toISOString();
  const date = new Date(raw);
  return Number.isNaN(date.getTime())
    ? fallback.toISOString()
    : date.toISOString();
}

function parseAmount(value: FormDataEntryValue | null) {
  return parseThousands(String(value ?? ""));
}

function parseFinanceForm(formData: FormData) {
  const category = String(formData.get("category")) as FinanceCategory;
  const type = String(formData.get("type") ?? "masuk") as FinanceType;
  const paymentMethod = String(
    formData.get("paymentMethod") ?? "tunai",
  ) as PaymentMethod;
  const description = String(formData.get("description") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const occurredAt = parseDate(formData.get("occurredAt"));
  const inputAt = parseDate(formData.get("inputAt"));

  let amount = parseAmount(formData.get("amount"));
  let amountTunai = parseAmount(formData.get("amountTunai"));
  let amountTransfer = parseAmount(formData.get("amountTransfer"));

  if (paymentMethod === "tunai") {
    amountTunai = amount;
    amountTransfer = 0;
  } else if (paymentMethod === "transfer") {
    amountTransfer = amount;
    amountTunai = 0;
  } else if (paymentMethod === "gabungan") {
    amount = amountTunai + amountTransfer;
  }

  if (!description || amount <= 0) {
    throw new Error("Deskripsi dan nominal wajib diisi");
  }

  return {
    category,
    type,
    amount,
    amount_tunai: amountTunai,
    amount_transfer: amountTransfer,
    payment_method: paymentMethod,
    description,
    reference,
    occurred_at: occurredAt,
    input_at: inputAt,
  };
}

export async function createFinanceEntry(formData: FormData) {
  await requireFinanceMutate();
  await createFinance(parseFinanceForm(formData));
  revalidatePath("/keuangan");
  revalidatePath("/dashboard");
  revalidatePath("/bagi-hasil");
}

export async function updateFinanceEntry(formData: FormData) {
  await requireFinanceMutate();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("ID transaksi tidak ditemukan");

  await updateFinance(id, parseFinanceForm(formData));
  revalidatePath("/keuangan");
  revalidatePath("/dashboard");
  revalidatePath("/bagi-hasil");
}

export async function deleteFinanceEntry(id: string) {
  await requireFinanceMutate();
  await deleteFinance(id);
  revalidatePath("/keuangan");
  revalidatePath("/dashboard");
  revalidatePath("/bagi-hasil");
}
