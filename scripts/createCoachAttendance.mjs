import { createClient } from "@insforge/sdk";

const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
  anonKey: "ik_1dce07713f32acb6714f601e6a2f8554",
});

async function run() {
  console.log("Attempting to create CoachAttendance table via RPC...");

  // Try exec_sql RPC
  const { error } = await insforge.database.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS "CoachAttendance" (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "coachId" UUID NOT NULL REFERENCES "Coach"(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
        notes TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        UNIQUE("coachId", date)
      );
    `
  });

  if (error) {
    const keys = Object.getOwnPropertyNames(error);
    const errStr = keys.length > 0 
      ? keys.map(k => `${k}: ${error[k]}`).join(", ")
      : String(error);
    console.error("RPC failed:", errStr);
    console.log("\n=== Run this SQL manually in InsForge dashboard: ===\n");
    console.log(`CREATE TABLE IF NOT EXISTS "CoachAttendance" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "coachId" UUID NOT NULL REFERENCES "Coach"(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("coachId", date)
);`);
  } else {
    console.log("✅ CoachAttendance table created successfully!");
    
    // Verify
    const { data, error: verifyErr } = await insforge.database
      .from("CoachAttendance")
      .select("id")
      .limit(1);

    if (verifyErr) {
      console.log("Verify failed:", keys.map(k => `${k}: ${verifyErr[k]}`).join(", "));
    } else {
      console.log("✅ Table verified! Ready to use.");
    }
  }
}

run().catch(console.error);
