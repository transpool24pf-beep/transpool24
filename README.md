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

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000); you’ll be redirected to `/de` (default locale).

## Languages

Default UI language: **German**. Language switcher in header: Arabic, English, Turkish, French, Spanish.

## Order flow

1. Customer fills the multi-step order form (company, addresses, cargo size XS–XL, phone).
2. Price is calculated from distance × cargo category.
3. Customer clicks “Pay now” → Stripe Checkout.
4. On success, Stripe webhook marks the job as `paid` in Supabase and triggers the admin webhook (if set).
5. You assign the job manually to drivers in Pforzheim.

## Project structure

- `src/app/[locale]/` – localized pages (home, order, order/success)
- `src/components/` – Header, Footer, OrderForm
- `src/app/api/` – create-checkout-session, webhooks/stripe
- `messages/*.json` – translations (de, en, ar, tr, fr, es)
- `supabase/schema.sql` – tables: profiles, jobs, driver_documents

## Deploy on Vercel

Connect the repo, add the same env vars as in `.env.local`, and set `NEXT_PUBLIC_APP_URL` to your production URL. Use that URL in Stripe for the webhook endpoint.
