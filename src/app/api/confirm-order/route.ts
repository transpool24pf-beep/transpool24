import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(24).toString("base64url");
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
    const confirmationToken = generateToken();

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
        logistics_status: "confirmed",
        confirmation_token: confirmationToken,
      })
      .select("id")
      .single();

    if (insertError || !job) {
      console.error("[confirm-order] Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save order" },
        { status: 500 }
      );
    }

    const summary = [
      `Neuer bestätigter Auftrag: ${job.id}`,
      `Firma: ${companyName}`,
      `Telefon: ${phone}`,
      `Abholung: ${pickupAddress}`,
      `Lieferung: ${deliveryAddress}`,
      `Ladung: ${cargoSize}, ${distanceKm} km`,
      `Betrag: ${(priceCents / 100).toFixed(2)} EUR`,
    ].join("\n");

    const webhookUrl = process.env.ADMIN_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "order.confirmed",
            job_id: job.id,
            confirmation_token: confirmationToken,
            company_name: companyName,
            phone,
            pickup_address: pickupAddress,
            delivery_address: deliveryAddress,
            cargo_size: cargoSize,
            distance_km: distanceKm,
            price_cents: priceCents,
            summary,
          }),
        });
      } catch (e) {
        console.error("[confirm-order] Admin webhook failed:", e);
      }
    }

    const whatsappMessage = [
      "🚚 TransPool24 – Neuer Auftrag",
      "",
      `Firma: ${companyName}`,
      `Tel: ${phone}`,
      `Abholung: ${pickupAddress}`,
      `Lieferung: ${deliveryAddress}`,
      `Ladung: ${cargoSize} | ${distanceKm} km`,
      `Betrag: ${(priceCents / 100).toFixed(2)} EUR`,
      `Ref: ${job.id}`,
    ].join("\n");
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    return NextResponse.json({
      jobId: job.id,
      confirmationToken,
      whatsappLink,
    });
  } catch (e) {
    console.error("[confirm-order] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
