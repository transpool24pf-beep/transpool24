import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { rateLimitResponse } from "@/lib/rate-limit";
import { getBookingsSettings } from "@/lib/bookings-settings";
import { getPricingSettings } from "@/lib/settings";
import { isCargoCategoryId } from "@/lib/cargo";
import { computeOrderPricingFromAddresses } from "@/lib/order-pricing-compute";
import { randomBytes, randomInt } from "crypto";

const VALID_CARGO = ["XS", "M", "L"] as const;

/** 6-digit order number for display (e.g. 568364) */
function generateOrderNumber(): number {
  return randomInt(100000, 1000000);
}
const VALID_SERVICE_TYPES = ["driver_only", "driver_car", "driver_car_assistant"] as const;

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function POST(req: Request) {
  try {
    const limited = rateLimitResponse(req, "confirm");
    if (limited) return limited;
    const body = await req.json();
    const {
      companyName,
      email,
      phone,
      pickupAddress,
      deliveryAddress,
      pickupTime,
      cargoSize,
      serviceType = "driver_car",
      cargoDetails,
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

    const cargoCat = cargoDetails && typeof cargoDetails === "object" ? (cargoDetails as { cargoCategory?: unknown }).cargoCategory : undefined;
    if (cargoCat == null || cargoCat === "" || !isCargoCategoryId(cargoCat)) {
      return NextResponse.json({ error: "CARGO_CATEGORY_REQUIRED" }, { status: 400 });
    }

    const cd = cargoDetails && typeof cargoDetails === "object" ? (cargoDetails as Record<string, unknown>) : null;
    const weightKgRaw = cd?.weightKg != null ? Number(cd.weightKg) : NaN;
    const packageCountRaw = cd?.packageCount != null ? Number(cd.packageCount) : NaN;
    const photoUrlsRaw = Array.isArray(cd?.photoUrls) ? (cd!.photoUrls as unknown[]) : [];
    const photoUrls = photoUrlsRaw.filter(
      (u): u is string => typeof u === "string" && /^https?:\/\//i.test(u.trim())
    );
    if (!Number.isFinite(weightKgRaw) || weightKgRaw <= 0) {
      return NextResponse.json({ error: "CARGO_WEIGHT_REQUIRED" }, { status: 400 });
    }
    if (!Number.isFinite(packageCountRaw) || packageCountRaw < 1) {
      return NextResponse.json({ error: "CARGO_PACKAGES_REQUIRED" }, { status: 400 });
    }
    if (photoUrls.length < 1) {
      return NextResponse.json({ error: "CARGO_PHOTOS_REQUIRED" }, { status: 400 });
    }

    const bookings = await getBookingsSettings();
    if (bookings.paused) {
      return NextResponse.json({ error: "BOOKINGS_PAUSED" }, { status: 503 });
    }

    const departureTime =
      pickupTime && !Number.isNaN(Date.parse(pickupTime)) ? new Date(pickupTime) : null;

    const st = VALID_SERVICE_TYPES.includes(serviceType as (typeof VALID_SERVICE_TYPES)[number])
      ? (serviceType as (typeof VALID_SERVICE_TYPES)[number])
      : "driver_car";
    const pricing = await getPricingSettings();
    const pricingOpts = {
      price_per_km_cents: pricing.price_per_km_cents,
      driver_hourly_rate_cents: pricing.driver_hourly_rate_cents,
      driver_only_hourly_cents: pricing.driver_only_hourly_cents,
      assistant_fee_cents: pricing.assistant_fee_cents,
      weight_surcharge_cents_per_10kg: pricing.weight_surcharge_cents_per_10kg,
      cargo_category_adjustment_cents: pricing.cargo_category_adjustment_cents,
    };

    const weightKg = weightKgRaw;
    const priced = await computeOrderPricingFromAddresses({
      pickupAddress,
      deliveryAddress,
      departureTime,
      weightKg,
      cargoCategory: typeof cargoCat === "string" ? cargoCat : null,
      cargoSize,
      serviceType: st,
      pricingOpts,
    });

    if (!priced.ok) {
      return NextResponse.json(
        { error: "Could not calculate route distance for the given addresses" },
        { status: 400 }
      );
    }

    const p = priced.data;
    const distanceKm = p.distanceKm;
    const durationMinutes = p.durationMinutes;
    const breakdown = p.breakdown;
    const priceCents = breakdown.totalCents;
    const weightSurchargeCents = breakdown.weightSurchargeCents;
    const cargoCategorySurchargeCents = breakdown.cargoCategorySurchargeCents;
    const roundTripMinutes = p.roundTripMinutes;
    const loadingMinutes = p.loadingMinutes;
    const unloadingMinutes = p.unloadingMinutes;
    const totalDriverMinutes = p.totalDriverMinutes;

    /** Fahrerpreis = 18 × Hin- und Rückfahrt (Cent) — 18 Cent pro km Hin+Rück */
    const roundTripKm = distanceKm * 2;
    const driverPriceCents = Math.round(18 * roundTripKm);

    const supabase = createServerSupabase();
    const confirmationToken = generateToken();
    let orderNumber = generateOrderNumber();
    const maxAttempts = 5;
    let attempt = 0;
    let job: { id: string } | null = null;
    let insertError: unknown = null;

    while (attempt < maxAttempts) {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          order_number: orderNumber,
          company_name: companyName,
        phone,
        customer_email: email || null,
        preferred_pickup_at: pickupTime || null,
        pickup_address: pickupAddress,
        pickup_city: "Pforzheim",
        delivery_address: deliveryAddress,
        delivery_city: null,
        cargo_size: cargoSize,
        cargo_details:
          cargoDetails && typeof cargoDetails === "object"
            ? {
                ...cargoDetails,
                cargoCategory: cargoDetails.cargoCategory ?? null,
                weightKg,
                packageCount: Math.round(packageCountRaw),
                photoUrls,
                routeTerrain: p.routeTerrain,
                routeWeather: p.routeWeather,
                routeDriveTimeMultiplier: p.routeDriveTimeMultiplier,
                terrainSource: p.terrainSource,
                weatherSource: p.weatherSource,
                weightSurchargeCents,
                cargoCategorySurchargeCents,
                roundTripMinutes,
                loadingMinutes,
                unloadingMinutes,
                totalDriverMinutes,
              }
            : null,
        service_type: st,
        distance_km: distanceKm,
        duration_minutes: durationMinutes ?? null,
        price_cents: priceCents,
        driver_price_cents: driverPriceCents,
        assistant_price_cents:
          st === "driver_car_assistant" && breakdown.assistantCents > 0
            ? breakdown.assistantCents
            : null,
        payment_status: "pending",
        logistics_status: "confirmed",
        confirmation_token: confirmationToken,
        })
        .select("id")
        .single();
      job = data;
      insertError = error;
      if (!error && data) break;
      const isUniqueViolation = (error as { code?: string })?.code === "23505";
      if (error && isUniqueViolation && attempt < maxAttempts - 1) {
        orderNumber = generateOrderNumber();
        attempt++;
        continue;
      }
      break;
    }

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
      `Gewicht: ${weightKg} kg | Stück/Pakete: ${Math.round(packageCountRaw)} | Fotos: ${photoUrls.length}`,
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
