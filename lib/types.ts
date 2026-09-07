export type Role = "super_admin" | "admin" | "teknisi";
export type PsbStatus = "lead" | "survey" | "install" | "aktif" | "batal";
export type FinanceCategory =
  | "invoice"
  | "shodaqoh"
  | "belanja"
  | "dtt"
  | "voucher_mitra"
  | "tanggungan";
export type FinanceType = "masuk" | "keluar";
export type PaymentMethod = "tunai" | "transfer" | "gabungan";

export type Profile = {
  id: string;
  name: string;
  role: Role;
};

export type IspPartner = {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  active: boolean;
};

export type PsbOrder = {
  id: string;
  customerName: string;
  nik: string | null;
  phone: string | null;
  address: string;
  packageName: string | null;
  packagePrice: number;
  fee: number;
  installDate: string | null;
  cableDistance: string | null;
  wifiSsid: string | null;
  pppoeUser: string | null;
  wifiPassword: string | null;
  status: PsbStatus;
  notes: string | null;
  ispPartnerId: string | null;
  customerId: string | null;
  surveyAt: string | null;
  installAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ispPartner?: IspPartner | null;
};

export type FinanceEntry = {
  id: string;
  category: FinanceCategory;
  type: FinanceType;
  amount: number;
  amountTunai: number;
  amountTransfer: number;
  paymentMethod: PaymentMethod;
  description: string;
  reference: string | null;
  occurredAt: string;
  inputAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfitShareSetting = {
  id: string;
  ppnRate: number;
  bhpUsoRate: number;
  saganetShare: number;
  ispShare: number;
};

export type Customer = {
  id: string;
  name: string;
  nik: string | null;
  phone: string | null;
  address: string | null;
  packageName: string | null;
  monthlyFee: number;
  wifiSsid: string | null;
  pppoeUser: string | null;
  status: string;
  ispPartnerId: string | null;
  installedAt: string | null;
};
