# SaGa-Net Workspace

Aplikasi manajemen WiFi untuk rekap keuangan, PSB, pelanggan, dan bagi hasil ISP. Database memakai **Supabase** via `@supabase/supabase-js`. Autentikasi: **Auth.js** + Supabase Auth (email/password) dengan peran di tabel `profiles`.

## Setup

1. Buat project di [supabase.com](https://supabase.com)
2. Salin **Project URL**, **anon key**, dan **service_role key** ke `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_jwt_here
AUTH_SECRET=change-me-to-a-long-random-string
AUTH_TRUST_HOST=true
```

`SUPABASE_SERVICE_ROLE_KEY` wajib untuk menambah akun dari menu Pengguna. Ambil **secret** key di Supabase → Settings → API Keys (`sb_secret_...` atau JWT `service_role`), bukan publishable/anon.

3. Di Supabase Dashboard → **SQL Editor**, jalankan isi file [`supabase/schema.sql`](supabase/schema.sql)
4. Buat user pertama di Supabase → **Authentication → Users → Add user** (email + password). Saat login pertama ke app, akun ini otomatis jadi **Super Admin** jika belum ada `super_admin` di tabel `profiles`.
5. Jalankan app:

```bash
npm install
npm run db:seed
npm run dev
```

Buka `http://localhost:3000/login`.

## Peran

| Peran | Akses |
| --- | --- |
| Super Admin | Penuh (PSB, pelanggan, keuangan, pengguna) |
| Admin | Lihat keuangan & data; tidak mutate |
| Teknisi | Mutasi PSB/pelanggan; keuangan tersembunyi |

## Membuat akun Admin / Teknisi

Hanya Super Admin yang bisa menambah akun dari app.

1. Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah diisi di `.env` (nilai secret, bukan kosong), lalu restart `npm run dev`.
2. Login sebagai Super Admin.
3. Buka menu **Pengguna** → **Tambah Pengguna**.
4. Isi nama, email, password (minimal 6 karakter), lalu pilih peran **Admin** atau **Teknisi**.
5. Simpan. Akun baru bisa masuk di `/login` dengan email dan password tersebut.

Setelah peran diubah di Pengguna, user perlu **login ulang** agar peran baru aktif.

## Deploy ke Vercel

Project ini Next.js App Router — cocok di-deploy ke [vercel.com](https://vercel.com).

### 1. Siapkan GitHub
Repo lokal belum punya remote. Push ke GitHub dulu (buat repo kosong di GitHub, lalu):

```bash
git add .
git commit -m "Prepare SaGa-Net Workspace for Vercel deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/saganet-management.git
git push -u origin main
```

Jangan commit file `.env` (sudah di `.gitignore`).

### 2. Import di Vercel
1. Buka [vercel.com/new](https://vercel.com/new) → Import repository GitHub di atas.
2. Framework: **Next.js** (otomatis).
3. Di **Environment Variables**, isi:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret / service_role key |
| `AUTH_SECRET` | string acak panjang (mis. `openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | `true` |

4. Deploy. Setelah selesai, salin URL (mis. `https://saganet-management.vercel.app`).

### 3. Setelah deploy
- Opsional: set `AUTH_URL` = URL Vercel Anda (Environment Variables → Redeploy).
- Pastikan schema Supabase sudah dijalankan (sama seperti lokal).
- Login dengan akun Super Admin yang sudah ada di Supabase Auth.

### Catatan
- Build lokal: `npm run build` harus lulus (sudah).
- Domain custom: Vercel → Project → Settings → Domains.

## Fitur

- Dashboard, PSB, Pelanggan, Keuangan, Bagi Hasil ISP, Pengguna
- Search/filter di PSB, Pelanggan, dan Keuangan
- Export CSV laporan keuangan & bagi hasil
- PWA manifest sudah ada; wrapping APK (Capacitor) ditunda
