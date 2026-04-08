import { createClient } from "@insforge/sdk";

const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
  anonKey: "ik_1dce07713f32acb6714f601e6a2f8554",
});

async function main() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  
  const coachRes = await insforge.database.from("Coach").select("*, Sport(name)").order("fullName", { ascending: true });
  if (coachRes.error) console.error("coachRes:", coachRes.error);
  
  const sportRes = await insforge.database.from("Sport").select("id, name").eq("isActive", true);
  if (sportRes.error) console.error("sportRes:", sportRes.error);
  
  const enrollmentsRes = await insforge.database.from("SportsEnrollment").select("sportId").eq("status", "active");
  if (enrollmentsRes.error) console.error("enrollmentsRes:", enrollmentsRes.error);
  
  const paymentsRes = await insforge.database.from("Payment").select("sportId, amount, memberId, paymentType").eq("category", "income").gte("date", startOfMonth);
  if (paymentsRes.error) console.error("paymentsRes:", paymentsRes.error);
  
  console.log("Done checking.");
}

main();
