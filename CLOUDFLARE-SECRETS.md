# Fix live login checklist (Cloudflare Dashboard)

Worker: **shive-dental-clinics**  
URL: https://dash.cloudflare.com/b82993580bed27dbe1dae142d07fa7e7/workers/services/view/shive-dental-clinics/production/settings

Go to **Settings → Variables and Secrets → Add** → choose **Encrypt** for each:

| Name | Value (from your `.env` / Supabase) |
|------|-------------------------------------|
| `AUTH_SECRET` | Long random string (same as local `.env`) |
| `ADMIN_PASSWORD` | `Raunak@12583` (website admin login password) |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` from Supabase API keys |
| `SUPABASE_DB_PASSWORD` | Supabase **database** password (pooler; same as you used for `db:push`) |

Plain **Variables** (non-secret) are already in `wrangler.jsonc`: `ADMIN_LOGIN_ID`, `ADMIN_EMAIL`, Supabase public URL/key.

After saving, click **Deploy** or push to `main` (GitHub Action) or run locally:

```bash
npm run deploy
```

Check: https://shive-dental-clinics.shivedentalclinic-com.workers.dev/api/health/login-hints  
All items should be OK / Connected / Configured.

**Login:** `rk331159@gmail.com` / `Raunak@12583`
