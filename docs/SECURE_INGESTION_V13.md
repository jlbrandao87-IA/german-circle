# German Circle v1.3 — secure feed ingestion and matching gate

## Current status

Implemented and locally tested: administrator-only CSV ingestion API, server-side contract lookup, batch validation, review queue, hash-based duplicate protection, audit logging, and a pure reviewed-record-to-Dream-Matching integration. All records remain private. No supplier has been onboarded; no production database or API is connected. There is **no automatic publication** or consumer-facing market claim.

## Installation and configuration (authorized operator)

1. Install dependencies in the Next.js application and configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` on the server only. Never place the service key in a client environment.
2. Apply migrations `202611060001` through `202611060008` to your Supabase project.
3. Create a verified staff user in Supabase Auth, then grant administrative import access **with privileged SQL**:
   `insert into public.ingestion_admins (user_id,enabled) values ('<auth user uuid>',true);`
4. Enter the supplier in `public.market_suppliers` with actual permission references, exact source domains, country scope, permission expiry, and `enabled=true` **only after contract review**.
5. Send an authenticated POST to `/api/admin/feed-import` using that staff user's real access token. Example JSON body:
   `{ "supplier_id": "approved_supplier", "csv": "supplier_id,...", "mapping": {"columns": {...}} }`
   See `examples` and `lib/partner-feed.ts` for CSV column mapping details. The service validates the session against Supabase and then checks `ingestion_admins` through the server-side service role.
6. Review the pending records in `market_import_review_queue`; verify source ownership, listing availability, contractual rights, duplicates and technical compatibility before marking approved with a separate privileged review workflow. No automatic public listing ingestion has been enabled.

## Safety / operational controls

- Missing or expired supplier contract => reject.
- Unauthorized caller => reject. Never trust supplier permission information in the HTTP request.
- Batch limit: 4 MiB text and 1,000 parsed records per API call; deployments should additionally apply request-size limits at the reverse proxy.
- Payload checksum allows idempotent re-submission of exact unchanged records; changed prices produce a different historical candidate.
- Audit retains actor id, supplier id, counts and timestamps, but not full raw CSV.
- If audit insert fails after queue insert, response flags possible partial success; operator must reconcile before retrying. For stronger atomic guarantees, migrate to a PostgreSQL RPC transaction.
- Pending and rejected records cannot enter the Dream Matching adapter; expired candidates are excluded.
- Production go-live still requires a comprehensive authorization review, end-to-end security testing, supplier agreements, service integration and deploy/build validation.

## Explicitly not implemented

- Supplier API credentials and live acquisition in Germany/Portugal.
- Backend cron/scheduling, real-time notifications, production Supabase authentication verification, regulatory tax engine or public marketplace publication.
- Automated approval or display of unlicensed images/listings.
