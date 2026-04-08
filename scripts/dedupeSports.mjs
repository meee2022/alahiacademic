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
  const { data: sports, error } = await insforge.database.from("Sport").select("*").order("name");
  
  if (error) {
    console.error("Failed to fetch sports", error);
    return;
  }

  console.log("Found sports:", sports.map(s => `${s.name} (${s.id})`));

  // Find duplicates
  const keep = new Map();
  const remove = [];
  
  for (const sport of sports) {
    if (!keep.has(sport.name)) {
       keep.set(sport.name, sport.id);
    } else {
       remove.push(sport.id);
    }
  }

  console.log("Keeper IDs:", Array.from(keep.values()));
  console.log("Removing IDs:", remove);

  if (remove.length > 0) {
      // For safety, re-link enrollments and payments to the keeper IDs before deleting
      for (const sport of sports) {
          if (remove.includes(sport.id)) {
              const keeperId = keep.get(sport.name);
              
              const updates = [
                  insforge.database.from("SportsEnrollment").update({ sportId: keeperId }).eq("sportId", sport.id),
                  insforge.database.from("Payment").update({ sportId: keeperId }).eq("sportId", sport.id),
                  insforge.database.from("BeltTest").update({ sportId: keeperId }).eq("sportId", sport.id),
                  insforge.database.from("Attendance").update({ sportId: keeperId }).eq("sportId", sport.id),
                  insforge.database.from("Coach").update({ sportId: keeperId }).eq("sportId", sport.id)
              ];
              
              await Promise.all(updates);
              console.log(`Re-linked dependencies from ${sport.id} to ${keeperId}`);
              
              // Now delete the duplicate
              const { error: delErr } = await insforge.database.from("Sport").delete().eq("id", sport.id);
              if (delErr) {
                 console.error(`Failed to delete sport ${sport.id}`, delErr);
              } else {
                 console.log(`Deleted duplicate sport: ${sport.name} (${sport.id})`);
              }
          }
      }
      console.log("Cleanup complete!");
  } else {
      console.log("No duplicates found to remove.");
  }
}

run().catch(console.error);
