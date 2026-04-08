import { createClient } from "@insforge/sdk";
import fs from "fs";

const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
  anonKey: "ik_1dce07713f32acb6714f601e6a2f8554",
  global: {
    headers: {
      Authorization: `Bearer ik_1dce07713f32acb6714f601e6a2f8554` // Use the admin key
    }
  }
});

async function main() {
  const email = "testadmin@admin.com";
  const password = "Password@123";
  const log = [];
  try {
    const { data: signupData, error: signupError } = await insforge.auth.signUp({
      email,
      password,
    });
    log.push({ step: "signup", data: signupData, error: signupError });

    let uid = signupData?.user?.id;
    
    // If user already exists, let's just try to login to get the ID, or maybe it returns the ID on signup error? No.
    if (!uid && signupError?.message?.includes("already exists")) {
       log.push({ step: "User already exists. Please choose a new email." });
    }

    if (uid) {
      const { error: insertErr } = await insforge.database.from("SystemUser").upsert({
        id: uid,
        name: "Test Admin",
        email: email,
        passwordHash: "N/A",
        role: "admin",
      });
      log.push({ step: "insert SystemUser", error: insertErr });
    }
  } catch(e) { log.push({ step: "catch", error: e.message, stack: e.stack }); }

  fs.writeFileSync("output3.json", JSON.stringify(log, null, 2));
}

main().catch(e => {
  fs.writeFileSync("output3.json", JSON.stringify({ fatal: e.message, stack: e.stack }));
});
