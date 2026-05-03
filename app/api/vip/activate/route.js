export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Add or remove VIP codes here anytime ──────────────────
const VIP_CODES = [
  "CREATORSSTUDIOVIP2026",
  "VIP2026",
  "MEDIAINSIDER",
];

export async function POST(request) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return Response.json({ valid: false, message: "Missing code or user" }, { status: 400 });
    }

    const normalized = code.trim().toUpperCase();

    if (!VIP_CODES.includes(normalized)) {
      return Response.json({ valid: false, message: "Invalid VIP code — please check and try again" });
    }

    // Set expiry to 90 days from now
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 90);

    const { error } = await supabase
      .from("profiles")
      .update({
        is_pro: true,
        vip_expiry: expiry.toISOString(),
      })
      .eq("id", userId);

    if (error) {
      return Response.json({ valid: false, message: "Could not activate — please try again" }, { status: 500 });
    }

    return Response.json({
      valid: true,
      message: "VIP access activated! You have 3 months of full Creator access.",
      expiry: expiry.toISOString(),
    });
  } catch (err) {
    return Response.json({ valid: false, message: "Server error" }, { status: 500 });
  }
}
