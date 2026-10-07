# SaGa-Net Mobile (offline-first)

APK Flutter untuk lapangan & admin: **PSB**, **Pelanggan**, **Keuangan**, **Bagi Hasil**, dan **Pengguna** (super admin, baca/edit role). Data tersimpan di SQLite lokal, sync ke Supabase (project yang sama dengan web) saat online.

Membuat akun pengguna baru tetap lewat **web** (butuh service role).

> Catatan: MVP memakai **sqflite** (SQLite) agar tanpa `build_runner`. Konflik sync: last-write-wins.

## Prasyarat

1. [Flutter SDK](https://docs.flutter.dev/get-started/install) (stable)
2. Android Studio / cmdline-tools + device/emulator
3. Supabase URL + **anon/publishable** key (bukan service role)

## Setup

```bash
cd mobile
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
cp dart_defines.json.example dart_defines.json
# edit dart_defines.json — isi URL + anon key dari .env web
```

## Menjalankan

```bash
flutter run --dart-define-from-file=dart_defines.json
```

Login dengan akun Supabase Auth yang sama seperti web.

## Build APK release (wajib)

```bash
cd mobile
cp dart_defines.json.example dart_defines.json   # jika belum ada
# isi SUPABASE_URL + SUPABASE_ANON_KEY (anon/publishable dari dashboard)

flutter pub get
flutter build apk --release --dart-define-from-file=dart_defines.json
```

Install ulang APK di HP (uninstall yang lama dulu jika perlu).  
Kalau ikon home screen masih logo Flutter: uninstall dulu, install APK baru, atau reboot HP (launcher sering cache ikon).

**Login memakai akun Supabase Authentication** yang sama dengan web (bukan “password lokal”).  
Uji dulu di https://saganet-management.vercel.app/login — kalau web juga gagal, reset password di Supabase → Authentication → Users.

### Ikon launcher

Sumber: `assets/icon/app_icon.png` (dari logo web `public/logo-saganet.jpg`). Regenerasi setelah ganti logo:

```bash
cd mobile
# update assets/icon/app_icon.png (PNG square 1024x1024)
dart run flutter_launcher_icons
flutter build apk --release --dart-define-from-file=dart_defines.json
```

### Signing (production)

1. Buat upload keystore:

```bash
cd mobile/android
keytool -genkeypair -v \
  -keystore upload-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload
```

2. Buat `android/key.properties` dari `android/key.properties.example`:

```properties
storeFile=../upload-keystore.jks
storePassword=PASSWORD_KEYSTORE
keyAlias=upload
keyPassword=PASSWORD_ALIAS
```

3. `android/key.properties` dan file `.jks` sudah di-ignore Git. Build Gradle otomatis:
- pakai **release key** jika `android/key.properties` ada
- fallback ke **debug key** jika file itu belum dibuat

4. Build release production:

```bash
cd mobile
flutter build apk --release --dart-define-from-file=dart_defines.json
flutter build appbundle --release --dart-define-from-file=dart_defines.json
```

Output:
- APK: `build/app/outputs/flutter-apk/app-release.apk`
- AAB: `build/app/outputs/bundle/release/app-release.aab`

5. Untuk distribusi paling minim warning, utamakan **Google Play Internal Testing** / **Closed Testing** dengan file `.aab`.

6. Untuk kirim cepat ke tim lapangan, APK signed tetap bisa dipakai, tapi beberapa HP tetap bisa menampilkan warning Play Protect saat sideload.

### Troubleshooting AAB

Error `failed to strip debug symbols` / `Failed to find cmdline-tools` biasanya karena Android **cmdline-tools** belum terpasang.

1. Pastikan folder ada: `$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager`
2. Set Java Android Studio lalu cek doctor:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
flutter doctor
# jika diminta:
flutter doctor --android-licenses
```

3. Build ulang AAB.

## RBAC (sama web)

| Role | PSB / Pelanggan | Keuangan / Bagi Hasil | Pengguna |
|------|-----------------|------------------------|----------|
| Super Admin | mutasi | lihat + mutasi keuangan | lihat / ubah role |
| Admin | lihat | lihat | — |
| Teknisi | mutasi | — | — |

## Sync

- **Push:** baris lokal `dirty=1` di-upsert ke Supabase (PSB, pelanggan, keuangan); hapus lokal (`deleted_locally`) dihapus di server lalu dibersihkan lokal
- **Pull:** baris remote dengan `updated_at` lebih baru + pengaturan bagi hasil
- **Reconcile:** ID lokal yang tidak ada di server (dan tidak dirty) dihapus
- Konflik: **last-write-wins** (`updated_at`)
- Tombol **Sync** di AppBar / Beranda; auto-sync saat app buka jika online (error tetap ditampilkan)

Versi app: lihat splash / drawer (`v0.2.0`).

## Uji offline

1. Login online → Sync sekali
2. Airplane mode → tambah/edit PSB, pelanggan, atau keuangan
3. Online lagi → Sync → cek data di web / Supabase

## Struktur

```
lib/
  auth/           # session + role cache (secure storage)
  data/           # SQLite + sync engine
  screens/        # login, home, PSB, pelanggan, keuangan, bagi hasil, pengguna
  widgets/        # status badge, dll
```
