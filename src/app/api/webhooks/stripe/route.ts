import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { jobIdFromCheckoutSession } from "@/lib/stripe-webhook-helpers";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const jobId = jobIdFromCheckoutSession(session);
    if (!jobId) {
      console.error("No job_id in Stripe session");
      return NextResponse.json({ received: true });
    }

    const supabase = createServerSupabase();

    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      console.error("Job not found:", jobId, fetchError);
      return NextResponse.json({ received: true });
    }

    const customerEmail =
      (session.customer_details?.email as string | undefined) ??
      (session.customer_email as string | undefined);

    await supabase
      .from("jobs")
      .update({
        payment_status: "paid",
        logistics_status: "paid",
        stripe_payment_intent_id: session.payment_intent as string | null,
        ...(customerEmail && { customer_email: customerEmail }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (customerEmail) {
      try {
        const pdfBuffer = await generateInvoicePdf({ ...job, customer_email: customerEmail });
        const token = job.confirmation_token as string | null | undefined;
        const confirmPaymentUrl = token
          ? `${SITE}/de/order/confirm?job_id=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`
          : null;
        const trackOrderUrl = token
          ? `${SITE}/de/order/track?job_id=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`
          : null;
        await sendOrderConfirmationEmail(customerEmail, { ...job, customer_email: customerEmail }, pdfBuffer, {
          confirmPaymentUrl,
          trackOrderUrl,
        });
      } catch (e) {
        console.error("[TransPool24] Confirmation email/PDF failed:", e);
      }
    } else {
      console.warn("[TransPool24] No customer email in session, skipping confirmation email");
    }

    const webhookUrl = process.env.ADMIN_WEBHOOK_URL;

    const summary = [
      `Neuer bezahlter Auftrag: ${jobId}`,
      `Firma: ${job.company_name}`,
      `Telefon: ${job.phone}`,
      `Abholung: ${job.pickup_address}`,
      `Lieferung: ${job.delivery_address}`,
      `Ladung: ${job.cargo_size}, ${job.distance_km} km`,
      `Betrag: ${(job.price_cents / 100).toFixed(2)} EUR`,
    ].join("\n");

    console.log("[TransPool24] Paid order:", summary);

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "order.paid",
            job_id: jobId,
            company_name: job.company_name,
            phone: job.phone,
            pickup_address: job.pickup_address,
            delivery_address: job.delivery_address,
            cargo_size: job.cargo_size,
            distance_km: job.distance_km,
            price_cents: job.price_cents,
            summary: summary,
          }),
        });
      } catch (e) {
        console.error("Admin webhook failed:", e);
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
