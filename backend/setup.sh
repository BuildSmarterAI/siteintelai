#!/bin/bash
set -e

echo "⚙️ Setting up Hospitality Activity Layer (HII)..."

# 1. Create Supabase tables
echo "🧱 Running migrations..."
for f in ./backend/migrations/*.sql; do
  echo "Applying $f..."
  supabase db execute < "$f"
done

# 2. Deploy Supabase Edge Functions
echo "🚀 Deploying Edge Functions..."
supabase functions deploy hii-ingest
supabase functions deploy hii-alerts
supabase functions deploy hii-score
supabase functions deploy hii-geojson

# 3. Schedule cron jobs (requires pg_cron extension)
echo "🕒 Scheduling cron jobs..."
echo "Note: Run the following SQL in your Supabase SQL Editor:"
echo ""
echo "select cron.schedule("
echo "  'hii-ingest-nightly',"
echo "  '0 2 * * *',"
echo "  \$\$"
echo "  select net.http_post("
echo "      url:='https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-ingest',"
echo "      headers:='{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer YOUR_ANON_KEY\"}'::jsonb"
echo "  ) as request_id;"
echo "  \$\$"
echo ");"
echo ""
echo "select cron.schedule("
echo "  'hii-alerts-hourly',"
echo "  '0 * * * *',"
echo "  \$\$"
echo "  select net.http_post("
echo "      url:='https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/hii-alerts',"
echo "      headers:='{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer YOUR_ANON_KEY\"}'::jsonb"
echo "  ) as request_id;"
echo "  \$\$"
echo ");"

echo "✅ Setup complete. HII module ready for integration with SiteIntel."
