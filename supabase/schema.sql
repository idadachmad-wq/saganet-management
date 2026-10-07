-- Jalankan di Supabase SQL Editor (satu kali)
-- SaGa-Net Workspace schema

create extension if not exists "pgcrypto";

create table if not exists users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'operator' check (role in ('admin', 'operator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists isp_partners (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  code text not null unique,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  nik text,
  phone text,
  address text,
  package_name text,
  monthly_fee integer not null default 0,
  wifi_ssid text,
  pppoe_user text,
  status text not null default 'aktif'
    check (status in ('aktif', 'isolir', 'putus')),
  isp_partner_id text references isp_partners(id) on delete set null,
  installed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists psb_orders (
  id text primary key default gen_random_uuid()::text,
  customer_name text not null,
  nik text,
  phone text,
  address text not null,
  package_name text,
  package_price integer not null default 0,
  fee integer not null default 0,
  install_date date,
  cable_distance text,
  wifi_ssid text,
  pppoe_user text,
  wifi_password text,
  status text not null default 'lead'
    check (status in ('lead', 'survey', 'install', 'aktif', 'batal')),
  notes text,
  isp_partner_id text references isp_partners(id) on delete set null,
  customer_id text references customers(id) on delete set null,
  survey_at timestamptz,
  install_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists finance_entries (
  id text primary key default gen_random_uuid()::text,
  category text not null
    check (category in ('invoice', 'shodaqoh', 'belanja', 'dtt', 'voucher_mitra', 'tanggungan')),
  type text not null default 'masuk' check (type in ('masuk', 'keluar')),
  amount integer not null,
  amount_tunai integer not null default 0,
  amount_transfer integer not null default 0,
  payment_method text not null default 'tunai'
    check (payment_method in ('tunai', 'transfer', 'gabungan')),
  description text not null,
  reference text,
  occurred_at timestamptz not null default now(),
  input_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profit_share_settings (
  id text primary key default gen_random_uuid()::text,
  ppn_rate double precision not null default 0.11,
  bhp_uso_rate double precision not null default 0.0175,
  saganet_share double precision not null default 0.65,
  isp_share double precision not null default 0.35,
  updated_at timestamptz not null default now()
);

-- Peran aplikasi, PK = UID di Authentication → Users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'teknisi'
    check (role in ('super_admin', 'admin', 'teknisi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Manajemen ODC (induk ODP): + feeder OLT, splitter, kapasitas core
create table if not exists odcs (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  name text,
  location text not null,
  latitude double precision,
  longitude double precision,
  cable_code text,
  tube_color text,
  core_color text,
  port_count integer not null default 16 check (port_count >= 1),
  feeder_olt text,
  splitter_ratio text,
  capacity_cores integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists odc_ports (
  id text primary key default gen_random_uuid()::text,
  odc_id text not null references odcs(id) on delete cascade,
  port_number integer not null check (port_number >= 1),
  status text not null default 'kosong'
    check (status in ('kosong', 'terpakai')),
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (odc_id, port_number)
);

-- Manajemen ODP: kabel, warna tube/core, titik letak, port
create table if not exists odps (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  name text,
  location text not null,
  latitude double precision,
  longitude double precision,
  cable_code text,
  tube_color text,
  core_color text,
  port_count integer not null default 8 check (port_count >= 1),
  odc_id text references odcs(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists odp_ports (
  id text primary key default gen_random_uuid()::text,
  odp_id text not null references odps(id) on delete cascade,
  port_number integer not null check (port_number >= 1),
  status text not null default 'kosong'
    check (status in ('kosong', 'terpakai')),
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (odp_id, port_number)
);

-- Auth app sendiri (Auth.js), bukan Supabase Auth → buka akses tabel untuk anon key
alter table users enable row level security;
alter table isp_partners enable row level security;
alter table customers enable row level security;
alter table psb_orders enable row level security;
alter table finance_entries enable row level security;
alter table profit_share_settings enable row level security;
alter table profiles enable row level security;
alter table odcs enable row level security;
alter table odc_ports enable row level security;
alter table odps enable row level security;
alter table odp_ports enable row level security;

drop policy if exists "allow_all_users" on users;
drop policy if exists "allow_all_isp" on isp_partners;
drop policy if exists "allow_all_customers" on customers;
drop policy if exists "allow_all_psb" on psb_orders;
drop policy if exists "allow_all_finance" on finance_entries;
drop policy if exists "allow_all_settings" on profit_share_settings;
drop policy if exists "allow_all_profiles" on profiles;
drop policy if exists "allow_all_odcs" on odcs;
drop policy if exists "allow_all_odc_ports" on odc_ports;
drop policy if exists "allow_all_odps" on odps;
drop policy if exists "allow_all_odp_ports" on odp_ports;

create policy "allow_all_users" on users for all using (true) with check (true);
create policy "allow_all_isp" on isp_partners for all using (true) with check (true);
create policy "allow_all_customers" on customers for all using (true) with check (true);
create policy "allow_all_psb" on psb_orders for all using (true) with check (true);
create policy "allow_all_finance" on finance_entries for all using (true) with check (true);
create policy "allow_all_settings" on profit_share_settings for all using (true) with check (true);
create policy "allow_all_profiles" on profiles for all using (true) with check (true);
create policy "allow_all_odcs" on odcs for all using (true) with check (true);
create policy "allow_all_odc_ports" on odc_ports for all using (true) with check (true);
create policy "allow_all_odps" on odps for all using (true) with check (true);
create policy "allow_all_odp_ports" on odp_ports for all using (true) with check (true);
