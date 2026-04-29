export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body, sig, process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature error:", err.message);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    const userId =
      event.data.object?.metadata?.userId ||
      event.data.object?.subscription_data?.metadata?.userId;

    if (!userId) {
      return Response.json({ received: true });
    }

    if (event.type === "checkout.session.completed") {
      // Payment successful — upgrade user
      await supabase
        .from("profiles")
        .update({ is_pro: true })
        .eq("id", userId);
      console.log("User upgraded:", userId);
    }

    if (
      event.type === "customer.subscription.deleted" ||
      (event.type === "customer.subscription.updated" &&
        event.data.object.status === "canceled")
    ) {
      // Subscription cancelled — downgrade user
      await supabase
        .from("profiles")
        .update({ is_pro: false })
        .eq("id", userId);
      console.log("User downgraded:", userId);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
