import { createClient } from "@insforge/sdk";
import fs from "fs";

const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
  anonKey: "ik_1dce07713f32acb6714f601e6a2f8554",
  global: {
    headers: {
      Authorization: `Bearer ik_1dce07713f32acb6714f601e6a2f8554`
    }
  }
});

async function main() {
  const log = [];
  try {
    const { data: usersData, error: usersErr } = await insforge.auth.admin.listUsers();
    log.push({ step: "listUsers", data: usersData?.users?.length, error: usersErr });
    
    let uid = null;
    if (usersData?.users) {
      const u = usersData.users.find(u => u.email === "eng.mohamed87@live.com");
      if (u) {
        uid = u.id;
        // update password
        const { error: updPwErr } = await insforge.auth.admin.updateUserById(uid, {
          password: "Realmadridclub@2604",
          email_confirm: true
        });
        log.push({ step: "update user password", error: updPwErr });
      }
    }

    if (!uid) {
      const { data: newUser, error: createErr } = await insforge.auth.admin.createUser({
        email: "eng.mohamed87@live.com",
        password: "Realmadridclub@2604",
        email_confirm: true
      });
      uid = newUser?.user?.id;
      log.push({ step: "create user", uid, error: createErr });
    }

    // Now update SystemUser
    const { data: userRow, error: selectErr } = await insforge.database
      .from("SystemUser")
      .select("*")
      .eq("email", "eng.mohamed87@live.com")
      .maybeSingle();

    log.push({ step: "select SystemUser", data: userRow, error: selectErr });

    if (!userRow && uid) {
      const { error: insertErr } = await insforge.database.from("SystemUser").insert({
        id: uid,
        name: "Mohamed",
        email: "eng.mohamed87@live.com",
        passwordHash: "N/A",
        role: "admin",
      });
      log.push({ step: "insert SystemUser", error: insertErr });
    } else if (userRow) {
      const { error: updateErr } = await insforge.database.from("SystemUser").update({
        role: "admin"
      }).eq("email", "eng.mohamed87@live.com");
      log.push({ step: "update SystemUser", error: updateErr });
    }
  } catch(e) { log.push({ step: "catch", error: e.message, stack: e.stack }); }

  fs.writeFileSync("output2.json", JSON.stringify(log, null, 2));
}

main().catch(e => {
  fs.writeFileSync("output2.json", JSON.stringify({ fatal: e.message, stack: e.stack }));
});
