export const runtime = "nodejs";

export async function POST(request) {
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { email } = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://creators-studio.vercel.app";

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return Response.json({ error: "No customer found" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: baseUrl,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
