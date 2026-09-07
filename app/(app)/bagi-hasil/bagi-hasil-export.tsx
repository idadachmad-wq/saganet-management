"use client";

import { downloadCsv } from "@/lib/export-csv";

type ExportRow = {
  label: string;
  value: number;
};

type InvoiceRow = {
  description: string;
  occurredAt: string;
  amount: number;
  paymentMethod: string;
};

export function BagiHasilExport({
  monthValue,
  rows,
  invoices,
}: {
  monthValue: string;
  rows: ExportRow[];
  invoices: InvoiceRow[];
}) {
  return (
    <button
      type="button"
      className="btn btn-ghost w-full sm:w-auto"
      onClick={() => {
        downloadCsv(
          `bagi-hasil-${monthValue}.csv`,
          ["bagian", "nilai"],
          rows.map((r) => ({ bagian: r.label, nilai: r.value })),
        );
        downloadCsv(
          `bagi-hasil-invoice-${monthValue}.csv`,
          ["tanggal", "deskripsi", "metode", "nominal"],
          invoices.map((inv) => ({
            tanggal: inv.occurredAt.slice(0, 10),
            deskripsi: inv.description,
            metode: inv.paymentMethod,
            nominal: inv.amount,
          })),
        );
      }}
    >
      Export CSV
    </button>
  );
}
