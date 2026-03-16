import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";
import { calculatePriceCents } from "@/lib/pricing";
import { getRouteDistanceKm } from "@/lib/route-distance-server";

const VALID_CARGO = ["XS", "M", "L"] as const;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, token, locale: localeParam } = body;

    const supabase = createServerSupabase();
    let job: { id: string; company_name: string; pickup_address: string; delivery_address: string; cargo_size: string; distance_km: number | null; price_cents: number };

    if (jobId && token) {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, company_name, pickup_address, delivery_address, cargo_size, distance_km, price_cents")
        .eq("id", jobId)
        .eq("confirmation_token", token)
        .eq("payment_status", "pending")
        .single();
      if (error || !data) {
        return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
      }
      job = data;
    } else {
      const {
        companyName,
        phone,
        pickupAddress,
        deliveryAddress,
        cargoSize,
        locale,
      } = body;
      if (
        !companyName ||
        !phone ||
        !pickupAddress ||
        !deliveryAddress ||
        !cargoSize ||
        !VALID_CARGO.includes(cargoSize)
      ) {
        return NextResponse.json(
          { error: "Missing or invalid order fields" },
          { status: 400 }
        );
      }
      const distanceKm = await getRouteDistanceKm(pickupAddress, deliveryAddress);
      if (distanceKm === null || distanceKm <= 0) {
        return NextResponse.json(
          { error: "Could not calculate route distance for the given addresses" },
          { status: 400 }
        );
      }
      const priceCents = calculatePriceCents(distanceKm, cargoSize);
      const { data, error: insertError } = await supabase
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
        .select("id, company_name, pickup_address, delivery_address, cargo_size, distance_km, price_cents")
        .single();
      if (insertError || !data) {
        console.error("Supabase insert error:", insertError);
        if (insertError?.code === "PGRST205") {
          console.error(
            "PGRST205: Table 'jobs' not found. Run supabase/schema.sql in Supabase Dashboard → SQL Editor to create tables."
          );
        }
        return NextResponse.json(
          { error: "Failed to create order" },
          { status: 500 }
        );
      }
      job = data;
    }

    const locale = localeParam || "de";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${baseUrl}/${locale}/order/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      jobId && token
        ? `${baseUrl}/${locale}/order/confirm?job_id=${job.id}&token=${encodeURIComponent(token)}`
        : `${baseUrl}/${locale}/order`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `TransPool24 – Transport (${job.cargo_size}, ${job.distance_km ?? 0} km)`,
              description: `${job.pickup_address} → ${job.delivery_address}`,
            },
            unit_amount: job.price_cents,
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
