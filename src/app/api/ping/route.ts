import { insforge } from "@/lib/insforge/client";

export async function GET() {
  await insforge.from("Sport").select("id").limit(1);
  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
