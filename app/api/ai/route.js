export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "Missing API key" }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", JSON.stringify(data));
      return Response.json({ error: data }, { status: response.status });
    }

    return Response.json(data);
  } catch (err) {
    console.error("Route error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
