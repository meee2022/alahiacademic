import { createClient } from "@insforge/sdk";

const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
  anonKey: "ik_1dce07713f32acb6714f601e6a2f8554",
});

async function run() {
  console.log("Reloading schema cache...");
  const { error } = await insforge.database.rpc("exec_sql", {
    sql: `NOTIFY pgrst, 'reload schema'`
  });
  if (error) {
    console.error("Failed to reload schema:", error);
  } else {
    console.log("Schema reloaded successfully!");
  }
}

run();
