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
AUTH_SECRET=<hasil: openssl rand -hex 32>
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

### Reset dari nol (jika error terus)

1. Buka project lama → **Settings → General** → paling bawah → **Delete Project** → ketik nama project.
2. Buka [vercel.com/new](https://vercel.com/new) → Import `saganet-management`.
3. Sebelum Deploy, isi **Environment Variables** (semua 6 baris sekaligus). Salin dari `.env` lokal.
4. **Penting:** jangan centang *Sensitive/Secret* untuk `NEXT_PUBLIC_*` (harus tersedia saat build). Secret hanya untuk `SUPABASE_SERVICE_ROLE_KEY` dan `AUTH_SECRET`.
5. Deploy. Setelah domain tahu, set `AUTH_URL` = URL production, lalu Redeploy.

Atau lewat CLI (setelah `npx vercel login` + `npx vercel link`):

```bash
chmod +x scripts/vercel-reset-env.sh
./scripts/vercel-reset-env.sh
npx vercel --prod
```

### Environment Variables

| Name | Nilai | Sensitive? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | **Tidak** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key | **Tidak** |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` / service_role | **Ya** |
| `AUTH_SECRET` | dari `.env` (wajib) | **Ya** |
| `AUTH_TRUST_HOST` | `true` | Tidak |
| `AUTH_URL` | `https://….vercel.app` | Tidak |

Tanpa `AUTH_SECRET` → error login **Configuration**. Setelah ubah env → **Redeploy**.

Sebelum deploy, pastikan build lokal hijau:

```bash
npm run build
```

## Mobile offline (APK)

Klien lapangan offline-first (PSB + pelanggan) ada di folder [`mobile/`](mobile/). Lihat [`mobile/README.md`](mobile/README.md) untuk setup Flutter dan `flutter build apk`.

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
- PWA manifest
- APK offline Flutter: lihat [`mobile/README.md`](mobile/README.md)

## Scripts

```bash
npm run dev      # development
npm run build    # production build (sama seperti Vercel)
npm run start    # jalankan hasil build
npm run db:seed  # seed data contoh (butuh .env)
```
