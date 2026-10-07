-- Migrasi: manajemen ODC + tautan ODP → ODC induk
-- Jalankan di Supabase SQL Editor setelah migrasi ODP (jika ada).

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

alter table odps add column if not exists odc_id text references odcs(id) on delete set null;

alter table odcs enable row level security;
alter table odc_ports enable row level security;

drop policy if exists "allow_all_odcs" on odcs;
drop policy if exists "allow_all_odc_ports" on odc_ports;

create policy "allow_all_odcs" on odcs for all using (true) with check (true);
create policy "allow_all_odc_ports" on odc_ports for all using (true) with check (true);
