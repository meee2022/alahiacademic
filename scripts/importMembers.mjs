import fs from "fs";
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
  const data = JSON.parse(fs.readFileSync("parsed_members.json", "utf8"));
  console.log(`Starting import for ${data.length} members...`);

  let successCount = 0;
  let errorCount = 0;
  let errors = [];

  for (const member of data) {
    // Check if member exists
    const { data: existing, error: selectErr } = await insforge.database
      .from("Member")
      .select("id")
      .eq("fullNameArabic", member.fullNameArabic)
      .maybeSingle();

    if (selectErr) {
       errors.push({ name: member.fullNameArabic, error: selectErr });
       errorCount++;
       continue;
    }

    if (!existing) {
      const { error: insertErr } = await insforge.database.from("Member").insert({
        fullNameArabic: member.fullNameArabic,
        fullNameEnglish: member.fullNameEnglish || null,
        phoneFather: member.phoneFather || null,
        phoneMother: member.phoneMother || null,
        isSchoolProgram: false,
        isClubSon: false
      }); 

      if (insertErr) {
         errors.push({ name: member.fullNameArabic, error: insertErr });
         errorCount++;
         break; // stop on first insert error to debug
      } else {
         successCount++;
      }
    } else {
      successCount++; // count as success to skip
    }
  }

  console.log(`Import finished. Successfully inserted/updated ${successCount} members. Errors: ${errorCount}`);
  fs.writeFileSync("import_errors.json", JSON.stringify(errors, null, 2));
}

run().catch(e => {
  fs.writeFileSync("import_fatal_error.json", JSON.stringify({ message: e.message, stack: e.stack }, null, 2));
});
