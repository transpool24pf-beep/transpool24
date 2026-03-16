import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("job_id");
    const token = searchParams.get("token");

    if (!jobId || !token) {
      return NextResponse.json(
        { error: "Missing job_id or token" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();
    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("confirmation_token", token)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    if (job.payment_status !== "pending") {
      return NextResponse.json(
        { error: "Order already paid or cancelled" },
        { status: 400 }
      );
    }

    return NextResponse.json({ job });
  } catch (e) {
    console.error("[orders/confirm] GET error:", e);
    return NextResponse.json(
      { error: "Request failed" },
      { status: 500 }
    );
  }
}
