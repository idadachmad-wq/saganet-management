# SaGa-Net Workspace

Aplikasi manajemen WiFi untuk rekap keuangan, PSB, pelanggan, dan bagi hasil ISP.
Stack: **Next.js** (App Router) + **Supabase** + **Auth.js**.

## Setup lokal

1. Buat project di [supabase.com](https://supabase.com)
2. Salin `.env.example` → `.env`, lalu isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_or_sb_secret_key
AUTH_SECRET=<hasil: openssl rand -base64 32>
AUTH_TRUST_HOST=true
```

`SUPABASE_SERVICE_ROLE_KEY` wajib untuk menu Pengguna. Ambil **secret** key di Supabase → Settings → API Keys (`sb_secret_...` atau JWT `service_role`), bukan publishable/anon.

3. Di Supabase → **SQL Editor**, jalankan [`supabase/schema.sql`](supabase/schema.sql)
4. Buat user pertama di Supabase → **Authentication → Users → Add user**. Login pertama otomatis jadi **Super Admin** jika belum ada `super_admin` di `profiles`.
5. Jalankan:

```bash
npm install
npm run db:seed
npm run dev
```

Buka `http://localhost:3000/login`.

## Deploy ke Vercel (langkah wajib)

Repo: [idadachmad-wq/saganet-management](https://github.com/idadachmad-wq/saganet-management)

### 1. Environment Variables di Vercel

Project → **Settings → Environment Variables**. Centang **Production** (dan Preview jika perlu).

| Name | Nilai | Tipe di Vercel |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | **Environment** (bukan Secret) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key | **Environment** |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role / `sb_secret_...` | **Secret** |
| `AUTH_SECRET` | `openssl rand -base64 32` | **Secret** (wajib) |
| `AUTH_TRUST_HOST` | `true` | **Environment** |
| `AUTH_URL` | `https://saganet-management.vercel.app` | **Environment** (opsional, disarankan) |

Tanpa `AUTH_SECRET`, halaman login menampilkan error **Configuration** / "Server configuration".

Jangan commit file `.env`. Salin nilai dari `.env` lokal ke dashboard Vercel saja.

### 2. Deploy / Redeploy

- Import repo di [vercel.com/new](https://vercel.com/new) (Framework: Next.js), **atau**
- Push ke `main` — Vercel auto-deploy jika project sudah terhubung.
- Setelah mengubah env: **Deployments → Redeploy** (jangan hanya refresh browser).

### 3. Setelah live

- Pastikan schema Supabase sudah dijalankan (sama seperti lokal).
- Login dengan akun yang ada di Supabase Auth.
- Domain custom: Project → Settings → Domains.

## Peran

| Peran | Akses |
| --- | --- |
| Super Admin | Penuh (PSB, pelanggan, keuangan, pengguna) |
| Admin | Lihat keuangan & data; tidak mutate |
| Teknisi | Mutasi PSB/pelanggan; keuangan tersembunyi |

## Membuat akun Admin / Teknisi

1. Isi `SUPABASE_SERVICE_ROLE_KEY` di `.env` / Vercel, lalu restart / Redeploy.
2. Login Super Admin → **Pengguna → Tambah Pengguna**.
3. Password minimal 6 karakter. Setelah ubah peran, user perlu **login ulang**.

## Fitur

- Dashboard, PSB, Pelanggan, Keuangan, Bagi Hasil ISP, Pengguna
- Search/filter di PSB, Pelanggan, dan Keuangan
- Export CSV laporan keuangan & bagi hasil
- PWA manifest; wrapping APK (Capacitor) ditunda

## Scripts

```bash
npm run dev      # development
npm run build    # production build (sama seperti Vercel)
npm run start    # jalankan hasil build
npm run db:seed  # seed data contoh (butuh .env)
```
