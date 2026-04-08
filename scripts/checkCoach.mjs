import { createClient } from "@insforge/sdk";
const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
  anonKey: "ik_1dce07713f32acb6714f601e6a2f8554",
  global: { headers: { Authorization: `Bearer ik_1dce07713f32acb6714f601e6a2f8554` } }
});

async function run() {
  const { data, error } = await insforge.database.from("Coach").select("*").limit(1);
  console.log("Keys:", data && data.length ? Object.keys(data[0]) : "No data");
}
run();
