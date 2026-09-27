# Supabase Storage for admin uploads

Create a **public** bucket for clinic media uploads:

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `uploads`
3. Enable **Public bucket** (or add a policy allowing public read on `uploads/*`)

Example policy (SQL):

```sql
-- Allow public read
CREATE POLICY "Public read uploads"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );

-- Service role uploads bypass RLS; admin API uses SUPABASE_SECRET_KEY
```

Ensure `SUPABASE_SECRET_KEY` is set on Cloudflare Workers for `/api/admin/upload`.
