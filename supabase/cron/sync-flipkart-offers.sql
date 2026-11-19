-- Run only after creating these two secrets in Supabase Vault:
--   smart_deals_project_url = https://pbvcumybfsjlpvdtxrgo.supabase.co
--   smart_deals_sync_secret = same value as Edge Function secret SMART_DEALS_SYNC_SECRET
-- Keep the same random sync secret in Supabase Edge Function secrets and Vault.

select cron.schedule(
  'sync-flipkart-offers-every-30m',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'smart_deals_project_url') || '/functions/v1/sync-flipkart-offers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'smart_deals_sync_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
