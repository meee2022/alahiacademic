import * as XLSX from "xlsx";
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

const fileName = "2026-Al-Ahli-Martial-Arts-Academy.xlsx";

async function run() {
  const buf = fs.readFileSync(fileName);
  const workbook = XLSX.read(buf, { type: "buffer" });

  const sheet = workbook.Sheets["الادارة"];
  if (!sheet) {
    console.error("الادارة sheet not found");
    return;
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log("Total rows in الادارة:", rows.length);
  
  // Log first few rows to understand structure
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(rows[i]));
  }

  // Fetch sports to map IDs
  const { data: sports } = await insforge.database.from("Sport").select("id, name");
  const sportMap = new Map();
  sports.forEach(s => sportMap.set(s.name, s.id));
  
  // Sport name mapping from Arabic/English to our Sport enum
  const sportNameMap = {
    "Karate": "Karate",
    "كاراتية": "Karate",
    "كاراتيه": "Karate",
    "Kickboxing": "Kickboxing",
    "كيك بوكسينج": "Kickboxing",
    "كيك بوكس": "Kickboxing",
    "Gymnastics": "Gymnastics",
    "جمباز": "Gymnastics",
    "Taekwondo": "Taekwondo",
    "تايكوندو": "Taekwondo",
    "Judo": "Judo",
    "جودو": "Judo",
    "Arnis": "Arnis",
    "ارنيس": "Arnis",
  };

  // Headers are in row 1 and 2 (English + Arabic)
  // Data starts from row 3
  let successCount = 0;
  let errors = [];

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const sportRaw = row[1]; // Sport column
    const coachName1 = row[2]; // Coach name
    const coachName2 = row[3]; // Second coach (if any)
    const baseSalary = row[4]; // 1st salary
    const phone = row[5]; // mobile

    if (!coachName1 || typeof coachName1 !== 'string' || coachName1.trim() === '') continue;

    // Map sport
    const sportEnum = sportRaw ? sportNameMap[sportRaw.trim()] : null;
    const sportId = sportEnum ? sportMap.get(sportEnum) : null;

    // Check if coach exists
    const { data: existing } = await insforge.database.from("Coach")
      .select("id")
      .eq("fullName", coachName1.trim())
      .maybeSingle();

    if (!existing) {
      const { error } = await insforge.database.from("Coach").insert({
        fullName: coachName1.trim(),
        phone: phone ? String(phone).trim() : null,
        sportId: sportId || null,
        baseSalary: baseSalary && !isNaN(baseSalary) ? Number(baseSalary) : null,
        note: null
      });

      if (error) {
        errors.push({ coach: coachName1, error });
      } else {
        successCount++;
        console.log(`Inserted coach: ${coachName1}`);
      }
    }

    // Insert second coach if present
    if (coachName2 && typeof coachName2 === 'string' && coachName2.trim() !== '' && coachName2.trim() !== coachName1.trim()) {
      const { data: existing2 } = await insforge.database.from("Coach")
        .select("id")
        .eq("fullName", coachName2.trim())
        .maybeSingle();

      if (!existing2) {
        const { error } = await insforge.database.from("Coach").insert({
          fullName: coachName2.trim(),
          phone: null,
          sportId: sportId || null,
          baseSalary: null,
          note: "مدرب مساعد"
        });

        if (error) {
          errors.push({ coach: coachName2, error });
        } else {
          successCount++;
          console.log(`Inserted assistant coach: ${coachName2}`);
        }
      }
    }
  }

  console.log(`\nFinished. Inserted ${successCount} coaches. Errors: ${errors.length}`);
  if (errors.length > 0) {
    fs.writeFileSync("import_coaches_errors.json", JSON.stringify(errors, null, 2));
  }
}

run().catch(console.error);
