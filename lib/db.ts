import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin, hasServiceRoleKey } from "@/lib/supabase-admin";
import { parseRole } from "@/lib/rbac";
import type {
  Customer,
  FinanceEntry,
  IspPartner,
  Odp,
  OdpPort,
  OdpPortStatus,
  Profile,
  ProfitShareSetting,
  PsbOrder,
  PsbStatus,
  Role,
} from "@/lib/types";

type DbError = { message: string; code?: string };

function throwIfError(error: DbError | null) {
  if (!error) return;
  if (isMissingRelation(error)) return;
  throw new Error(error.message);
}

function throwIfWriteError(error: DbError | null) {
  if (!error) return;
  if (isMissingRelation(error)) {
    throw new Error(
      "Tabel database SaGa-Net belum ada. Jalankan isi supabase/schema.sql di SQL Editor project ini.",
    );
  }
  throw new Error(error.message);
}

function isMissingRelation(error: DbError | null) {
  if (!error) return false;
  const text = `${error.code ?? ""} ${error.message}`.toLowerCase();
  return (
    text.includes("42p01") ||
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("could not find the table")
  );
}

function mapPartner(row: Record<string, unknown> | null): IspPartner | null {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    phone: (row.phone as string | null) ?? null,
    active: Boolean(row.active),
  };
}

function mapPsb(row: Record<string, unknown>): PsbOrder {
  return {
    id: String(row.id),
    customerName: String(row.customer_name),
    nik: (row.nik as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: String(row.address),
    packageName: (row.package_name as string | null) ?? null,
    packagePrice: Number(row.package_price ?? 0),
    fee: Number(row.fee ?? 0),
    installDate: (row.install_date as string | null) ?? null,
    cableDistance: (row.cable_distance as string | null) ?? null,
    wifiSsid: (row.wifi_ssid as string | null) ?? null,
    pppoeUser: (row.pppoe_user as string | null) ?? null,
    wifiPassword: (row.wifi_password as string | null) ?? null,
    status: row.status as PsbStatus,
    notes: (row.notes as string | null) ?? null,
    ispPartnerId: (row.isp_partner_id as string | null) ?? null,
    customerId: (row.customer_id as string | null) ?? null,
    surveyAt: (row.survey_at as string | null) ?? null,
    installAt: (row.install_at as string | null) ?? null,
    activatedAt: (row.activated_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    ispPartner: mapPartner(
      (row.isp_partners as Record<string, unknown> | null) ?? null,
    ),
  };
}

function mapFinance(row: Record<string, unknown>): FinanceEntry {
  return {
    id: String(row.id),
    category: row.category as FinanceEntry["category"],
    type: row.type as FinanceEntry["type"],
    amount: Number(row.amount),
    amountTunai: Number(row.amount_tunai ?? 0),
    amountTransfer: Number(row.amount_transfer ?? 0),
    paymentMethod: row.payment_method as FinanceEntry["paymentMethod"],
    description: String(row.description),
    reference: (row.reference as string | null) ?? null,
    occurredAt: String(row.occurred_at),
    inputAt: String(row.input_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSetting(row: Record<string, unknown>): ProfitShareSetting {
  return {
    id: String(row.id),
    ppnRate: Number(row.ppn_rate),
    bhpUsoRate: Number(row.bhp_uso_rate),
    saganetShare: Number(row.saganet_share),
    ispShare: Number(row.isp_share),
  };
}

export async function listPsbOrders() {
  const { data, error } = await getSupabase()
    .from("psb_orders")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []).map((row) => mapPsb(row as Record<string, unknown>));
}

export async function createPsb(
  payload: Record<string, unknown>,
): Promise<PsbOrder> {
  const { data, error } = await getSupabase()
    .from("psb_orders")
    .insert(payload)
    .select("*")
    .single();
  throwIfWriteError(error);
  return mapPsb(data as Record<string, unknown>);
}

export async function updatePsb(
  id: string,
  payload: Record<string, unknown>,
): Promise<PsbOrder> {
  const { data, error } = await getSupabase()
    .from("psb_orders")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  throwIfWriteError(error);
  return mapPsb(data as Record<string, unknown>);
}

export async function deletePsb(id: string) {
  const { error } = await getSupabase().from("psb_orders").delete().eq("id", id);
  throwIfWriteError(error);
}

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    nik: (row.nik as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    packageName: (row.package_name as string | null) ?? null,
    monthlyFee: Number(row.monthly_fee ?? 0),
    wifiSsid: (row.wifi_ssid as string | null) ?? null,
    pppoeUser: (row.pppoe_user as string | null) ?? null,
    status: String(row.status ?? "aktif"),
    ispPartnerId: (row.isp_partner_id as string | null) ?? null,
    installedAt: (row.installed_at as string | null) ?? null,
  };
}

export async function listCustomers() {
  const { data, error } = await getSupabase()
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []).map((row) => mapCustomer(row as Record<string, unknown>));
}

export async function createCustomer(
  payload: Record<string, unknown>,
): Promise<Customer> {
  const { data, error } = await getSupabase()
    .from("customers")
    .insert(payload)
    .select("*")
    .single();
  throwIfWriteError(error);
  return mapCustomer(data as Record<string, unknown>);
}

export async function getCustomer(id: string) {
  const { data, error } = await getSupabase()
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data ? mapCustomer(data as Record<string, unknown>) : null;
}

export async function updateCustomer(
  id: string,
  payload: Record<string, unknown>,
) {
  const { data, error } = await getSupabase()
    .from("customers")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  throwIfWriteError(error);
  return mapCustomer(data as Record<string, unknown>);
}

export async function deleteCustomer(id: string) {
  const { error } = await getSupabase().from("customers").delete().eq("id", id);
  throwIfWriteError(error);
}

export async function listFinanceEntries() {
  const { data, error } = await getSupabase()
    .from("finance_entries")
    .select("*")
    .order("occurred_at", { ascending: false });
  throwIfError(error);
  return (data ?? []).map((row) => mapFinance(row as Record<string, unknown>));
}

export async function createFinance(payload: Record<string, unknown>) {
  const { error } = await getSupabase().from("finance_entries").insert(payload);
  throwIfWriteError(error);
}

export async function updateFinance(
  id: string,
  payload: Record<string, unknown>,
) {
  const { error } = await getSupabase()
    .from("finance_entries")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  throwIfWriteError(error);
}

export async function deleteFinance(id: string) {
  const { error } = await getSupabase()
    .from("finance_entries")
    .delete()
    .eq("id", id);
  throwIfWriteError(error);
}

export async function getProfitShareSetting() {
  const { data, error } = await getSupabase()
    .from("profit_share_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  throwIfError(error);
  return data ? mapSetting(data) : null;
}

export async function countActiveCustomers() {
  const { count, error } = await getSupabase()
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("status", "aktif");
  throwIfError(error);
  return count ?? 0;
}

export async function countOpenPsb() {
  const { count, error } = await getSupabase()
    .from("psb_orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["lead", "survey", "install"]);
  throwIfError(error);
  return count ?? 0;
}

export async function listRecentPsb(limit = 5) {
  const { data, error } = await getSupabase()
    .from("psb_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  throwIfError(error);
  return (data ?? []).map((row) => mapPsb(row as Record<string, unknown>));
}

export async function listFinanceSince(isoDate: string) {
  const { data, error } = await getSupabase()
    .from("finance_entries")
    .select("*")
    .gte("occurred_at", isoDate)
    .order("occurred_at", { ascending: false });
  throwIfError(error);
  return (data ?? []).map((row) => mapFinance(row as Record<string, unknown>));
}

export async function listInvoicesInRange(startIso: string, endIso: string) {
  const { data, error } = await getSupabase()
    .from("finance_entries")
    .select("*")
    .eq("category", "invoice")
    .eq("type", "masuk")
    .gte("occurred_at", startIso)
    .lt("occurred_at", endIso)
    .order("occurred_at", { ascending: false });
  throwIfError(error);
  return (data ?? []).map((row) => mapFinance(row as Record<string, unknown>));
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    role: parseRole(row.role),
  };
}

export async function getProfile(id: string) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (isMissingRelation(error)) return null;
  throwIfError(error);
  return data ? mapProfile(data as Record<string, unknown>) : null;
}

export async function listProfiles() {
  const { data, error } = await getSupabase().from("profiles").select("*");
  if (isMissingRelation(error)) return [];
  throwIfError(error);
  return (data ?? []).map((row) => mapProfile(row as Record<string, unknown>));
}

export async function countSuperAdmins() {
  const { count, error } = await getSupabase()
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  if (isMissingRelation(error)) return 0;
  throwIfError(error);
  return count ?? 0;
}

export async function upsertProfile(payload: {
  id: string;
  name: string;
  role: Role;
}) {
  const client = hasServiceRoleKey() ? getSupabaseAdmin() : getSupabase();
  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        id: payload.id,
        name: payload.name,
        role: payload.role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();
  if (isMissingRelation(error)) {
    return {
      id: payload.id,
      name: payload.name,
      role: payload.role,
    };
  }
  throwIfError(error);
  return mapProfile(data as Record<string, unknown>);
}

export async function ensureProfileForAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const existing = await getProfile(user.id);
  if (existing) return existing;

  const metaName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name.trim()
      : "";
  const name = metaName || user.email?.split("@")[0] || "Pengguna";
  const superCount = await countSuperAdmins();
  const role: Role = superCount === 0 ? "super_admin" : "teknisi";
  return upsertProfile({ id: user.id, name, role });
}

function mapOdpPort(row: Record<string, unknown>): OdpPort {
  return {
    id: String(row.id),
    odpId: String(row.odp_id),
    portNumber: Number(row.port_number),
    status: row.status as OdpPortStatus,
    label: (row.label as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapOdp(
  row: Record<string, unknown>,
  ports: OdpPort[] = [],
): Odp {
  return {
    id: String(row.id),
    code: String(row.code),
    name: (row.name as string | null) ?? null,
    location: String(row.location),
    latitude:
      row.latitude === null || row.latitude === undefined
        ? null
        : Number(row.latitude),
    longitude:
      row.longitude === null || row.longitude === undefined
        ? null
        : Number(row.longitude),
    cableCode: (row.cable_code as string | null) ?? null,
    tubeColor: (row.tube_color as string | null) ?? null,
    coreColor: (row.core_color as string | null) ?? null,
    portCount: Number(row.port_count ?? ports.length ?? 0),
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    ports: ports.sort((a, b) => a.portNumber - b.portNumber),
  };
}

async function listPortsForOdp(odpId: string): Promise<OdpPort[]> {
  const { data, error } = await getSupabase()
    .from("odp_ports")
    .select("*")
    .eq("odp_id", odpId)
    .order("port_number", { ascending: true });
  throwIfError(error);
  return (data ?? []).map((row) => mapOdpPort(row as Record<string, unknown>));
}

async function syncOdpPorts(odpId: string, portCount: number) {
  const ports = await listPortsForOdp(odpId);
  const byNumber = new Map(ports.map((p) => [p.portNumber, p]));
  const toInsert: { odp_id: string; port_number: number; status: string }[] =
    [];

  for (let n = 1; n <= portCount; n += 1) {
    if (!byNumber.has(n)) {
      toInsert.push({ odp_id: odpId, port_number: n, status: "kosong" });
    }
  }

  if (toInsert.length > 0) {
    const { error } = await getSupabase().from("odp_ports").insert(toInsert);
    throwIfWriteError(error);
  }

  const extras = ports
    .filter((p) => p.portNumber > portCount)
    .sort((a, b) => b.portNumber - a.portNumber);

  for (const port of extras) {
    if (port.status === "terpakai") {
      throw new Error(
        `Tidak bisa mengurangi port: port ${port.portNumber} masih terpakai`,
      );
    }
    const { error } = await getSupabase()
      .from("odp_ports")
      .delete()
      .eq("id", port.id);
    throwIfWriteError(error);
  }
}

export async function listOdps(): Promise<Odp[]> {
  const { data, error } = await getSupabase()
    .from("odps")
    .select("*")
    .order("code", { ascending: true });
  throwIfError(error);
  if (!data?.length) return [];

  const ids = data.map((row) => String((row as Record<string, unknown>).id));
  const { data: portRows, error: portError } = await getSupabase()
    .from("odp_ports")
    .select("*")
    .in("odp_id", ids)
    .order("port_number", { ascending: true });
  throwIfError(portError);

  const portsByOdp = new Map<string, OdpPort[]>();
  for (const row of portRows ?? []) {
    const port = mapOdpPort(row as Record<string, unknown>);
    const list = portsByOdp.get(port.odpId) ?? [];
    list.push(port);
    portsByOdp.set(port.odpId, list);
  }

  return data.map((row) => {
    const mapped = row as Record<string, unknown>;
    return mapOdp(mapped, portsByOdp.get(String(mapped.id)) ?? []);
  });
}

export async function getOdp(id: string): Promise<Odp | null> {
  const { data, error } = await getSupabase()
    .from("odps")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  const ports = await listPortsForOdp(id);
  return mapOdp(data as Record<string, unknown>, ports);
}

export async function createOdp(
  payload: Record<string, unknown>,
): Promise<Odp> {
  const portCount = Math.max(1, Number(payload.port_count ?? 8));
  const { data, error } = await getSupabase()
    .from("odps")
    .insert({ ...payload, port_count: portCount })
    .select("*")
    .single();
  throwIfWriteError(error);
  const id = String((data as Record<string, unknown>).id);
  await syncOdpPorts(id, portCount);
  const ports = await listPortsForOdp(id);
  return mapOdp(data as Record<string, unknown>, ports);
}

export async function updateOdp(
  id: string,
  payload: Record<string, unknown>,
): Promise<Odp> {
  const { data, error } = await getSupabase()
    .from("odps")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  throwIfWriteError(error);

  if (payload.port_count !== undefined) {
    const portCount = Math.max(1, Number(payload.port_count));
    await syncOdpPorts(id, portCount);
  }

  const ports = await listPortsForOdp(id);
  return mapOdp(data as Record<string, unknown>, ports);
}

export async function deleteOdp(id: string) {
  const { error } = await getSupabase().from("odps").delete().eq("id", id);
  throwIfWriteError(error);
}

export async function updateOdpPort(
  id: string,
  payload: { status?: OdpPortStatus; label?: string | null },
): Promise<OdpPort> {
  const body: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.label !== undefined) body.label = payload.label;

  const { data, error } = await getSupabase()
    .from("odp_ports")
    .update(body)
    .eq("id", id)
    .select("*")
    .single();
  throwIfWriteError(error);
  return mapOdpPort(data as Record<string, unknown>);
}

export type { Customer };
