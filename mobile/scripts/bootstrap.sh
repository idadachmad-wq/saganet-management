#!/usr/bin/env bash
# Bootstrap platform folders (android/ios) tanpa menimpa lib/ & pubspec.yaml
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter SDK belum terpasang. Install: https://docs.flutter.dev/get-started/install"
  exit 1
fi

if [[ ! -d android ]]; then
  echo "==> flutter create (android)…"
  flutter create . --project-name saganet_mobile --org id.saganet --platforms=android
fi

flutter pub get
echo "==> Siap. Salin .env.example → .env lalu: flutter run"
