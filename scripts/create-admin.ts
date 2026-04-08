import { insforge } from "../src/lib/insforge/client";

async function createAdmin() {
  const email = "ENG.MOHAMED87@LIVE.COM";
  const password = "Realmadridclub@2604";

  console.log(`Attempting to create admin user: ${email}`);

  const { data, error } = await insforge.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Error creating user:", error.message);
  } else {
    console.log("Success! Admin user created.");
    console.log("User Data:", data);
  }
}

createAdmin().catch(console.error);
