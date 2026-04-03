# TransPool24

Logistics marketplace for **Pforzheim & Region** (Germany). Book transport orders online with pre-payment via Stripe.

## Tech Stack

- **Next.js** (App Router), **Tailwind CSS**
- **Supabase** (Auth, Database, Storage)
- **Stripe** (Checkout, Webhooks)
- **Vercel** (Hosting)

## Setup

### 1. Install & env

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase and Stripe keys (see `.env.example`).

### 2. Supabase

- Create a project at [supabase.com](https://supabase.com).
- In **SQL Editor**, run the contents of `supabase/schema.sql` to create tables and RLS.
- Create a Storage bucket `driver-documents` if you use driver document uploads.
- In **Settings → API** copy: Project URL, `anon` key, `service_role` key.

### 3. Stripe

- Create a Stripe account and get **Secret key** and **Publishable key** (test mode for dev).
- **Webhooks**: add endpoint `https://your-domain.com/api/webhooks/stripe`, event `checkout.session.completed`, copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

### 4. Admin notification (optional)

- Set `ADMIN_WEBHOOK_URL` to a Zapier/Make/WhatsApp webhook URL. On each successful payment, the app sends a POST with order details so you can forward them to your Pforzheim drivers.

### 5. Confirmation email & PDF invoice (Resend)

- Create an API key at [resend.com](https://resend.com) and set `RESEND_API_KEY` in your env.
- Optional: set `RESEND_FROM_EMAIL` (e.g. `TransPool24 <noreply@transpool24.com>`). Default is `onboarding@resend.dev` for testing.
- After payment, the customer receives an email with a PDF invoice attached. The customer email is taken from Stripe Checkout.

If the `jobs` table already existed before adding this feature, run `supabase/add_customer_email.sql` in the SQL Editor once to add the `customer_email` column.

### 6. Distance & traffic-aware pricing (optional)

- **Google Maps**: Set `GOOGLE_MAPS_API_KEY` and enable **Directions API** (and **Geocoding API** for fallbacks). Route distance and map geometry use Directions on the full address strings (including Places-formatted lines that Nominatim often misses). When the customer sets a pickup date/time, the server sends `departure_time` for traffic-aware duration. Price can then include a duration-based component (driver hourly rate).
- **API key restrictions**: Distance runs on **Vercel’s server**, not in the browser. If the key uses **HTTP referrers (websites)** only, Directions/Geocoding from the server will fail (`REQUEST_DENIED`). Prefer **Application restrictions → None** (dev) or **API restrictions** listing Directions, Geocoding, Places (without referrer-only app restriction), or use a **second key** reserved for server routes.
- **Address autocomplete (Germany)**: With the same key, enable **Places API**. The order form uses Places Autocomplete + Place Details for street + house number; without the key, OpenStreetMap/Nominatim is used (less precise for house numbers).
- **Driver hourly rate**: Set `DRIVER_HOURLY_RATE_CENTS` (e.g. `2500` for 25 EUR/hour). Default is 2500. Used only when duration from Google is available.
- **Automatic route pricing factors** (no customer UI): Enable **Elevation API** on the same project so server-side pricing can classify terrain along pickup→delivery. Enable **Weather API** (Maps Platform) for current conditions at the route midpoint; if the Weather call fails, the server falls back to **Open-Meteo** (no extra key).
- If `GOOGLE_MAPS_API_KEY` is not set, the app uses OSRM for distance only (no duration, no traffic).

Run `supabase/add_duration_minutes.sql` once if your `jobs` table already exists, to add the `duration_minutes` column.

### 7. Admin dashboard (optional)

- Set `ADMIN_PASSWORD` in your env. Only you should know this password.
- Open `https://your-domain.com/admin` (or `/admin/login`). Enter the password to access the dashboard.
- **Orders**: list all orders, filter by status (قيد الانتظار / قيد التنفيذ / تم التسليم), update status, send confirmation email with PDF to customer.
- **Drivers**: list drivers with documents (Gewerbe, insurance, ID), avatar, and star rating (editable).
- **Settings**: change price per km (XS, M, L) and driver hourly rate (cents). These values are stored in the database and used for new orders.

For existing databases, run `supabase/add_admin_dashboard.sql` in the SQL Editor once to add the `settings` table and new columns (profiles: `star_rating`, `avatar_url`; jobs: `assigned_driver_id`).

### 8. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000); you’ll be redirected to `/de` (default locale).

## Languages

Default UI language: **German**. Language switcher in header: Arabic, English, Turkish, French, Spanish.

## Order flow

1. Customer fills the multi-step order form (company, email, phone, addresses, pickup date/time, cargo size XS–L).
2. Distance (and optionally duration with traffic) is calculated server-side; price = distance × cargo rate + duration × driver hourly rate when Google Maps is used.
3. Customer confirms the order (no payment yet); admin/drivers get notified. Customer receives a link to the confirmation page.
4. On the confirmation page, customer clicks “Pay now” → Stripe Checkout.
5. On success, Stripe webhook marks the job as `paid` in Supabase, sends a confirmation email with PDF invoice (Resend), and triggers the admin webhook (if set).
6. You assign the job manually to drivers in Pforzheim.

## Project structure

- `src/app/[locale]/` – localized pages (home, order, order/success)
- `src/components/` – Header, Footer, OrderForm
- `src/app/api/` – create-checkout-session, webhooks/stripe
- `messages/*.json` – translations (de, en, ar, tr, fr, es)
- `supabase/schema.sql` – tables: profiles, jobs, driver_documents
- `src/lib/email.ts` – Resend confirmation email; `src/lib/invoice-pdf.ts` – PDF invoice

## Deploy on Vercel

Connect the repo, add the same env vars as in `.env.local`, and set `NEXT_PUBLIC_APP_URL` to your production URL. Use that URL in Stripe for the webhook endpoint. For the admin dashboard, add `ADMIN_PASSWORD` in Vercel environment variables.

Pushes to the connected branch trigger a production deployment; the admin footer shows **environment**, **commit SHA**, and a **link to the current Vercel host** when `VERCEL_URL` is present.

### Database hardening (recommended for existing Supabase projects)

Run **`supabase/hardening_2026.sql`** once in the SQL Editor. It removes anonymous `INSERT` on `jobs`, enables **RLS** on `support_requests` (server-only via service role), adds **`jobs.last_ops_reminder_at`**, and adds useful **indexes**.

### API rate limits

Public POST/GET routes use a **per-instance** sliding window (IP from `x-forwarded-for`). Set **`RATE_LIMIT_DISABLED=1`** only for local stress tests. For strict multi-region limits, add Redis (e.g. Upstash) later.

### Cron: customer “still processing” reminder

`vercel.json` schedules **`GET /api/cron/order-reminders`** daily. In Vercel → Settings → Environment variables, set **`CRON_SECRET`** (same value Vercel sends as `Authorization: Bearer …` on cron invocations). Requires **`RESEND_API_KEY`** and the `last_ops_reminder_at` column from `hardening_2026.sql`.

### Tests

```bash
npm test
```

### Admin exports & reports

- **Orders → CSV export** downloads all jobs as CSV (authenticated admin).
- **Reports** includes **in_transit** count and **support tickets (7 days)**.
