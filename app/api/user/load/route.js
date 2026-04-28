import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return Response.json({ data: null });
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      return Response.json({ data: null });
    }
    return Response.json({ data });
  } catch (err) {
    return Response.json({ data: null });
  }
}
