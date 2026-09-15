import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rate-limit";

/** Online Stripe checkout is disabled: customers pay after delivery by invoice. */
export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "checkout");
  if (limited) return limited;
  return NextResponse.json(
    {
      error:
        "Online payment is disabled. Payment is due after delivery by official invoice.",
    },
    { status: 410 }
  );
}
