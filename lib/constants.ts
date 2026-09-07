export const APP_NAME = "SaGa-Net Workspace";

export const FINANCE_TABS = [
  { key: "invoice", label: "Uang Invoice", typeDefault: "masuk" as const },
  { key: "shodaqoh", label: "Uang Shodaqoh", typeDefault: "masuk" as const },
  { key: "belanja", label: "Uang Belanja", typeDefault: "keluar" as const },
  { key: "dtt", label: "Uang DTT", typeDefault: "masuk" as const },
  { key: "voucher_mitra", label: "Uang Voucher Mitra", typeDefault: "masuk" as const },
  { key: "tanggungan", label: "Tanggungan Perusahaan", typeDefault: "keluar" as const },
] as const;

export type FinanceTabKey = (typeof FINANCE_TABS)[number]["key"];

export const PAYMENT_METHODS = [
  { key: "tunai", label: "Tunai" },
  { key: "transfer", label: "Transfer" },
  { key: "gabungan", label: "Gabungan Tunai & Transfer" },
] as const;

export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]["key"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodKey, string> = {
  tunai: "Tunai",
  transfer: "Transfer",
  gabungan: "Gabungan",
};

export const PSB_STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  survey: "Survey",
  install: "Pemasangan",
  aktif: "Aktif",
  batal: "Batal",
};

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  aktif: "Aktif",
  isolir: "Isolir",
  putus: "Putus",
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", finance: false, users: false },
  { href: "/psb", label: "PSB", icon: "psb", finance: false, users: false },
  { href: "/pelanggan", label: "Pelanggan", icon: "pelanggan", finance: false, users: false },
  { href: "/keuangan", label: "Keuangan", icon: "keuangan", finance: true, users: false },
  { href: "/bagi-hasil", label: "Bagi Hasil ISP", icon: "bagihasil", finance: true, users: false },
  { href: "/pengguna", label: "Pengguna", icon: "pengguna", finance: false, users: true },
] as const;
