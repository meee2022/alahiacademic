import { createClient } from "@insforge/sdk";

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || "https://pzqe7ma6.ap-southeast.insforge.app";
const INSFORGE_KEY = process.env.NEXT_PUBLIC_INSFORGE_KEY || "ik_1dce07713f32acb6714f601e6a2f8554";

// InsForge backend for project: 7843222d-8357-4c9e-a913-8ce46bc84bad
export const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_KEY,
  headers: {
    Authorization: `Bearer ${INSFORGE_KEY}`
  }
});
