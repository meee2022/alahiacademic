// const fetch = require('node-fetch'); // Built-in fetch available in Node v18+

const INSFORGE_URL = "https://pzqe7ma6.ap-southeast.insforge.app";
const INSFORGE_KEY = "ik_1dce07713f32acb6714f601e6a2f8554";

async function runSQL() {
  const sql = `
    CREATE TABLE IF NOT EXISTS "SystemUser" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL CHECK ("role" IN ('admin', 'coach', 'accountant', 'receptionist')),
      "linkedCoachId" UUID
    );

    -- Enable RLS
    ALTER TABLE "SystemUser" ENABLE ROW LEVEL SECURITY;

    -- Policy for admins (simplified for setup)
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access' AND tablename = 'SystemUser') THEN
        CREATE POLICY "Admin full access" ON "SystemUser" FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END
    $$;
  `;

  try {
    const res = await fetch(`${INSFORGE_URL}/api/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INSFORGE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const json = await res.json();
    console.log("SQL Result:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

runSQL();
