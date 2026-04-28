import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const body = await request.json();
    const { userId, data } = body;
    if (!userId) {
      return Response.json({ error: "No userId" }, { status: 400 });
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...data }, { onConflict: "id" });
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
