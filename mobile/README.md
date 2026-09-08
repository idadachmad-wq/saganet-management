# SaGa-Net Mobile (offline-first)

APK Flutter untuk teknisi lapangan: **PSB** & **Pelanggan** tersimpan di SQLite lokal, sync ke Supabase (project yang sama dengan web) saat online.

Keuangan, bagi hasil, dan pengguna **tidak** ada di APK — pakai web admin.

> Catatan: MVP memakai **sqflite** (SQLite) agar tanpa `build_runner`. Perilaku sync LWW sama dengan rencana Drift.

## Prasyarat

1. [Flutter SDK](https://docs.flutter.dev/get-started/install) (stable)
2. Android Studio / cmdline-tools + device/emulator
3. Supabase URL + **anon/publishable** key (bukan service role)

## Setup

```bash
cd mobile
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
```

`bootstrap.sh` menjalankan `flutter create` (android) jika belum ada, lalu `flutter pub get`.

## Menjalankan

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_anon_or_publishable_key
```

Login dengan akun Supabase Auth yang sama seperti web. Role diambil dari tabel `profiles` (disimpan lokal untuk offline).

## Build APK release

```bash
flutter build apk --release \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_anon_or_publishable_key
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### Signing (production)

1. Buat keystore (`keytool -genkey ...`)
2. Isi `android/key.properties` (jangan commit)
3. Konfigurasi `android/app/build.gradle` signingConfigs — lihat [Flutter signing docs](https://docs.flutter.dev/deployment/android)

## Sync

- **Push:** baris lokal `dirty=1` di-upsert ke Supabase
- **Pull:** baris remote dengan `updated_at` lebih baru dari `last_sync_at`
- Konflik: **last-write-wins** (`updated_at`)
- Tombol **Sync** di Beranda; auto-sync saat app buka jika online

## Uji offline

1. Login online → Sync sekali
2. Airplane mode → tambah/edit PSB atau pelanggan
3. Online lagi → Sync → cek data di web / Supabase

## Struktur

```
lib/
  auth/           # session + role cache (secure storage)
  data/           # SQLite + sync engine
  screens/        # login, home, PSB, pelanggan
```
