export const runtime = "nodejs";

export async function POST(request) {
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { billing, userId, email, coupon } = await request.json();

    const prices = {
      monthly: "price_1TRaQ1Jr0gMGMAAGlDguPpmW",
      annual:  "price_1TRaZyJr0gMGMAAGsjfqnegE",
    };

    const priceId = prices[billing] || prices.monthly;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://creators-studio.vercel.app";

    const sessionParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId },
      },
      customer_email: email,
      success_url: baseUrl + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: baseUrl + "/upgrade",
      metadata: { userId },
    };

    // Apply coupon if provided (e.g. VIP2026)
    if (coupon) {
      sessionParams.discounts = [{ coupon }];
      // Remove trial when coupon applied — coupon gives 3 months free instead
      delete sessionParams.subscription_data.trial_period_days;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
