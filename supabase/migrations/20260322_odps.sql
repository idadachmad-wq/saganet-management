-- Migrasi: manajemen ODP
-- Jalankan di Supabase SQL Editor jika project sudah punya schema lama.

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

alter table odps enable row level security;
alter table odp_ports enable row level security;

drop policy if exists "allow_all_odps" on odps;
drop policy if exists "allow_all_odp_ports" on odp_ports;

create policy "allow_all_odps" on odps for all using (true) with check (true);
create policy "allow_all_odp_ports" on odp_ports for all using (true) with check (true);
