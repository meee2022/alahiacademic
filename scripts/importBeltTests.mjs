import * as XLSX from "xlsx";
import fs from "fs";
import { createClient } from "@insforge/sdk";

// Initialize the InsForge client
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

function excelDateToJSDate(excelDate) {
  if (!excelDate || isNaN(excelDate)) return null;
  const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
}

async function run() {
  const buf = fs.readFileSync(fileName);
  const workbook = XLSX.read(buf, { type: "buffer" });
  
  // Fetch members and sports
  const { data: members, error: memErr } = await insforge.database.from("Member").select("id, fullNameArabic");
  const { data: sports, error: sportErr } = await insforge.database.from("Sport").select("id, name");
  
  if (memErr || sportErr) {
      console.error("Error fetching dependencies", memErr || sportErr);
      return;
  }
  
  const memberMap = new Map();
  members.forEach(m => memberMap.set(m.fullNameArabic.trim(), m.id));
  
  // Assuming all belt tests in this sheet are Karate for now
  const sportId = sports.find(s => s.name === "Karate")?.id;

  const sheetName = "Belts الاختبارات";
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
      console.error("Belts sheet not found");
      return;
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
      if (rows[i] && rows[i].includes("الاسم بالعربي")) {
          headerRowIdx = i;
          break;
      }
  }

  if (headerRowIdx === -1) {
      console.error("Header not found in Belts sheet");
      return;
  }

  const headers = rows[headerRowIdx];
  const nameIdx = headers.findIndex(h => h === "الاسم بالعربي");
  const dateIdx = headers.findIndex(h => h === "تاريخ الاختبار");
  const beltIdx = headers.findIndex(h => h === "نوع الحزام");
  const notesIdx = headers.findIndex(h => h === "الشهادات");

  let successCount = 0;
  let errorCount = 0;
  let errors = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const name = row[nameIdx];
      if (!name || typeof name !== 'string' || name.trim() === '') continue;

      const memberId = memberMap.get(name.trim());
      if (!memberId) {
          errors.push({ type: "member_not_found", name });
          continue;
      }

      let testDate = new Date().toISOString().split("T")[0];
      if (dateIdx !== -1 && row[dateIdx]) {
          const parsed = excelDateToJSDate(row[dateIdx]);
          if (parsed) testDate = parsed;
      }

      const beltLevel = beltIdx !== -1 && row[beltIdx] ? String(row[beltIdx]) : "غير محدد";
      const notes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]) : null;

      // Check for duplicate
      const { data: existingBelt } = await insforge.database.from("BeltTest")
        .select("id")
        .eq("memberId", memberId)
        .eq("beltLevelTo", beltLevel)
        .maybeSingle();

      if (!existingBelt && sportId) {
          const { error: insertErr } = await insforge.database.from("BeltTest").insert({
              memberId,
              sportId,
              date: testDate + "T00:00:00.000Z", // Timestamp needed? Check schema. It says "string" date. Use ISO.
              beltLevelFrom: "سابق", 
              beltLevelTo: beltLevel,
              testFee: 0,
              passed: true,
              notes
          });

          if (insertErr) {
              errors.push({ type: "insert_error", name, error: insertErr });
              errorCount++;
          } else {
              successCount++;
          }
      }
  }

  console.log(`Finished processing belt tests. Inserted: ${successCount}, Errors: ${errorCount}`);
  fs.writeFileSync("import_belts_errors.json", JSON.stringify(errors, null, 2));
}

run().catch(console.error);
