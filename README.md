# Mariyam Shebaloy V7 — Multi-User Cloud Edition

This version keeps the existing clinic UI and adds account-based cloud storage.
Each signed-in user gets a separate workspace. Patient records, profile/clinic
branding, disease templates and custom medicines are stored in that user's row.

## Setup
1. Create a Supabase project.
2. Open SQL Editor and run `supabase-schema.sql`.
3. Open `config.js` and replace the URL and anon key.
4. Upload all files to the GitHub Pages repository root.
5. Open the HTTPS GitHub Pages URL and create an account.

The Supabase anon key is intended for browser use when Row Level Security is
correctly enabled. Never put a Supabase service-role key in this app.

## Important
- Each account is isolated by `auth.uid()` through PostgreSQL RLS.
- The DGDA medicine catalogue remains local/static; only custom medicines sync.
- This is an MVP SaaS foundation. Before selling at scale, add payment/subscription
  enforcement, audit logs, server-side validation, backups, privacy policy and
  a proper admin console.
