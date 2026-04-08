import { createClient } from "@insforge/sdk";

const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
  anonKey: "ik_1dce07713f32acb6714f601e6a2f8554",
  global: {
    headers: {
      Authorization: `Bearer ik_1dce07713f32acb6714f601e6a2f8554`
    }
  }
});

async function run() {
  // Create AppUser table
  const { error: e1 } = await insforge.database.rpc("exec_sql", {
    sql: `CREATE TABLE IF NOT EXISTS "AppUser" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      "fullName" TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','editor','viewer')),
      phone TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ DEFAULT now()
    )`
  });
  
  if (e1) {
    console.log("RPC exec_sql not available, trying direct insert approach...");
    // Try inserting directly — the table might already exist
    const { data, error: e2 } = await insforge.database.from("AppUser").select("id").limit(1);
    if (e2) {
      console.log("AppUser table does not exist. Please create it manually via InsForge dashboard.");
      console.log("SQL: CREATE TABLE \"AppUser\" (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, email TEXT NOT NULL UNIQUE, \"fullName\" TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'viewer', phone TEXT, \"isActive\" BOOLEAN NOT NULL DEFAULT true, \"createdAt\" TIMESTAMPTZ DEFAULT now())");
    } else {
      console.log("AppUser table already exists!", data);
    }
  } else {
    console.log("AppUser table created!");
  }

  // Create CoachAttendance table
  const { error: e3 } = await insforge.database.rpc("exec_sql", {
    sql: `CREATE TABLE IF NOT EXISTS "CoachAttendance" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      "coachId" UUID NOT NULL REFERENCES "Coach"(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','excused')),
      notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      UNIQUE("coachId", date)
    )`
  });

  if (e3) {
    console.log("CoachAttendance RPC failed, trying select...");
    const { data, error: e4 } = await insforge.database.from("CoachAttendance").select("id").limit(1);
    if (e4) {
      console.log("CoachAttendance table does not exist. Please create it via dashboard.");
      console.log('SQL: CREATE TABLE "CoachAttendance" (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, "coachId" UUID NOT NULL REFERENCES "Coach"(id) ON DELETE CASCADE, date DATE NOT NULL, status TEXT NOT NULL DEFAULT \'present\', notes TEXT, "createdAt" TIMESTAMPTZ DEFAULT now(), UNIQUE("coachId", date))');
    } else {
      console.log("CoachAttendance table already exists!");
    }
  } else {
    console.log("CoachAttendance table created!");
  }

  // Insert a default admin user
  const { error: e5 } = await insforge.database.from("AppUser").upsert({
    email: "eng.mohamed87@live.com",
    fullName: "المدير العام",
    role: "admin",
    isActive: true
  }, { onConflict: "email" });

  if (e5) {
    console.log("Could not insert default admin:", e5.message);
  } else {
    console.log("Default admin user ensured.");
  }
}

run().catch(console.error);
