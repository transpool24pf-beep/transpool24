import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      phone,
      pickupAddress,
      deliveryAddress,
      cargoSize,
      distanceKm,
      priceCents,
      locale,
    } = body;

    if (
      !companyName ||
      !phone ||
      !pickupAddress ||
      !deliveryAddress ||
      !cargoSize ||
      !Number.isFinite(distanceKm) ||
      !Number.isFinite(priceCents) ||
      priceCents < 100
    ) {
      return NextResponse.json(
        { error: "Missing or invalid order fields" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        company_name: companyName,
        phone,
        pickup_address: pickupAddress,
        pickup_city: "Pforzheim",
        delivery_address: deliveryAddress,
        delivery_city: null,
        cargo_size: cargoSize,
        distance_km: distanceKm,
        price_cents: priceCents,
        payment_status: "pending",
        logistics_status: "draft",
      })
      .select("id")
      .single();

    if (insertError || !job) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${baseUrl}/${locale}/order/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/${locale}/order`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `TransPool24 – Transport (${cargoSize}, ${distanceKm} km)`,
              description: `${pickupAddress} → ${deliveryAddress}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        job_id: job.id,
      },
      client_reference_id: job.id,
    });

    await supabase
      .from("jobs")
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Checkout session error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
