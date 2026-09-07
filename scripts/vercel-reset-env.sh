#!/usr/bin/env bash
# Sync .env lokal → Vercel Environment Variables (Production + Preview).
# Prasyarat: npx vercel login && npx vercel link
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "File .env tidak ada."
  exit 1
fi

if [[ ! -d .vercel ]]; then
  echo "Project belum di-link. Jalankan: npx vercel link"
  exit 1
fi

# Hapus env lama (abaikan error jika belum ada)
VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  AUTH_SECRET
  AUTH_TRUST_HOST
  AUTH_URL
)

echo "==> Menghapus env lama di Vercel (production + preview)..."
for name in "${VARS[@]}"; do
  npx vercel env rm "$name" production -y 2>/dev/null || true
  npx vercel env rm "$name" preview -y 2>/dev/null || true
done

echo "==> Menambah env baru dari .env..."
# shellcheck disable=SC1091
set -a
source .env
set +a

printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview

printf '%s' "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
printf '%s' "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

printf '%s' "$SUPABASE_SERVICE_ROLE_KEY" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
printf '%s' "$SUPABASE_SERVICE_ROLE_KEY" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview

printf '%s' "$AUTH_SECRET" | npx vercel env add AUTH_SECRET production
printf '%s' "$AUTH_SECRET" | npx vercel env add AUTH_SECRET preview

printf '%s' "${AUTH_TRUST_HOST:-true}" | npx vercel env add AUTH_TRUST_HOST production
printf '%s' "${AUTH_TRUST_HOST:-true}" | npx vercel env add AUTH_TRUST_HOST preview

if [[ -n "${AUTH_URL:-}" ]]; then
  printf '%s' "$AUTH_URL" | npx vercel env add AUTH_URL production
  printf '%s' "$AUTH_URL" | npx vercel env add AUTH_URL preview
fi

echo "==> Selesai. Redeploy:"
echo "    npx vercel --prod"
