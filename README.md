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

- **Google Maps**: Set `GOOGLE_MAPS_API_KEY` to use the Directions API. When the customer chooses a pickup date/time, the server uses it as `departure_time` for traffic-aware distance and duration. Price then includes a duration-based component (driver hourly rate).
- **Address autocomplete (Germany)**: With the same `GOOGLE_MAPS_API_KEY`, enable **Places API** in Google Cloud. The order form then uses Places Autocomplete + Place Details so customers get full street + house number suggestions; without the key, OpenStreetMap/Nominatim is used (less precise for house numbers).
- **Driver hourly rate**: Set `DRIVER_HOURLY_RATE_CENTS` (e.g. `2500` for 25 EUR/hour). Default is 2500. Used only when duration from Google is available.
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
