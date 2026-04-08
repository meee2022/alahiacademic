import { NextResponse } from "next/server";

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || "https://pzqe7ma6.ap-southeast.insforge.app";
const INSFORGE_KEY = process.env.NEXT_PUBLIC_INSFORGE_KEY || "ik_1dce07713f32acb6714f601e6a2f8554";

export async function GET() {
  try {
    const res = await fetch(`${INSFORGE_URL}/api/auth/users?limit=200`, {
      headers: {
        Authorization: `Bearer ${INSFORGE_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Auth users API error:", res.status, text);
      return NextResponse.json({ users: [], error: text }, { status: res.status });
    }

    const json = await res.json();
    // InsForge Auth API returns { data: [...] }
    const users = json.data || (Array.isArray(json) ? json : json.users || []);
    
    console.log(`Proxy: Fetched ${users.length} auth users`);
    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("Auth users fetch failed:", err);
    return NextResponse.json({ users: [], error: err.message }, { status: 500 });
  }
}
