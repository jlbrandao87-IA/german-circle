# German Circle — private staging playbook

## Scope and status
This repository contains an implementation candidate, NOT a deployed or production-certified application. Do not invite external users or import personal customer data before validation.

## 1. Create a private repository
In GitHub, select **New repository**, name it `german-circle`, choose **Private**, and do not auto-initialize a README or license. Upload the contents of this folder with GitHub Desktop or via Git CLI:

```bash
git init
git add .
git commit -m "Initial German Circle staging baseline"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/german-circle.git
git push -u origin main
```

Do not commit `.env.local`, credentials, VIN/registration plates, private member data, or production logs.

## 2. Check CI first
The `.github/workflows/ci.yml` workflow checks type safety, tests and build. GitHub Actions must become green before deployment. Dependencies require npm and an internet-connected build runner. This source archive contains no installed dependencies and no validated dependency lockfile yet; generate and commit `package-lock.json` after a verified install.

```bash
npm install
npm run typecheck
npm test
npm run build
```

## 3. Provision Supabase
Create a **new staging** Supabase project. Apply all SQL files from `supabase/migrations/` **in filename order** only after reviewing statements and backing up the staging database. Enable email authentication and configure allowed URL redirects to match staging. Store keys in local environment / host secret settings, never GitHub source.

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: public project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: client publishable/anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY`: server-side only, privileged, never included in frontend code

Supabase service-role access bypasses RLS; inspect every server-side use and authorization check before launch. Execute cross-user RLS penetration tests using two staging accounts.

## 4. Deploy to Vercel staging
Import the private GitHub repo into Vercel, attach the environment variables to a Preview/Staging environment, and deploy a preview. Use Vercel deployment protection to keep it inaccessible to the public. Protect source data independently via Supabase RLS, even when the site is password-protected. Never configure a public demo using real member data.

## 5. Validation gate
```bash
STAGING_URL=https://YOUR_PRIVATE_PREVIEW_URL npm run smoke:staging
```

Also verify in browser: (1) email login/logout; (2) Dream Garage create/edit/delete and limit of 5; (3) a second account cannot read first account's garage; (4) unauthorized ingest blocked; (5) admin review does not publish unapproved listings; (6) no false claims about cost-of-import or price; (7) mobile viewport; (8) privacy and data deletion flow.

## 6. Data-source launch gate
No use of third-party listing photos/text in published UI without proven usage rights. German and Portuguese supplier APIs are NOT connected yet. Import-cost quotes require validated ISV/IVA assumptions, dates and traceable source. Keep demonstrative prices explicitly labelled.

## Operational ownership
Accounts remain owned by project operator. Never send authentication secrets in chat messages, email, or tickets; configure them directly with Supabase/Vercel secret settings.
