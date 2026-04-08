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
  // Excel epoch is Jan 1, 1900.
  // 25569 is the number of days between Jan 1, 1900 and Jan 1, 1970
  const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

async function run() {
  const buf = fs.readFileSync(fileName);
  const workbook = XLSX.read(buf, { type: "buffer" });
  
  // Fetch all members and sports to map IDs
  const { data: members, error: memErr } = await insforge.database.from("Member").select("id, fullNameArabic");
  const { data: sports, error: sportErr } = await insforge.database.from("Sport").select("id, name");
  
  if (memErr || sportErr) {
      console.error("Error fetching dependencies", memErr || sportErr);
      return;
  }
  
  const memberMap = new Map();
  members.forEach(m => memberMap.set(m.fullNameArabic.trim(), m.id));
  
  const sportMap = new Map();
  sports.forEach(s => sportMap.set(s.name, s.id));

  const paymentSheets = [
    { sheetName: "اشتركات كاراتية Karate Pay", sportName: "Karate" },
    { sheetName: "اشتراكات كيك بوكس KB Pay", sportName: "Kickboxing" },
    { sheetName: "اشتراكات جمباز GYM Pay", sportName: "Gymnastics" },
    { sheetName: "حساب كريز", sportName: "Karate" },
    { sheetName: "اشتراك تايكودوtaekwondo Payment", sportName: "Taekwondo" },
    { sheetName: "اشتراكات جودو", sportName: "Judo" }
  ];

  let successCount = 0;
  let errorCount = 0;
  let errors = [];

  for (const mapping of paymentSheets) {
    const sheet = workbook.Sheets[mapping.sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find header
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        if (rows[i] && (rows[i].includes("الاسم ") || rows[i].includes("الاسم  Name") || rows[i].includes("NAME") || rows[i].includes("الاسماء"))) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) continue;
    const headers = rows[headerRowIdx];
    
    const nameIdx = headers.findIndex(h => typeof h === 'string' && (h.includes("الاسم") || h.includes("NAME")));
    const amountIdx = headers.findIndex(h => typeof h === 'string' && (h.includes("قيمة") || h.includes("PAYMENT") || h.includes("المبلغ")));
    const payDateIdx = headers.findIndex(h => typeof h === 'string' && h.includes("تاريخ الدفع"));
    const endDateIdx = headers.findIndex(h => typeof h === 'string' && h.includes("نهاية الاشتراك"));
    const notesIdx = headers.findIndex(h => typeof h === 'string' && (h.includes("ملاحظات") || h.includes("Notes") || h.includes("ملحوظات")));
    
    if (nameIdx === -1 || amountIdx === -1) continue;

    const sportId = sportMap.get(mapping.sportName);

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const name = row[nameIdx];
      if (!name || typeof name !== 'string' || name.trim() === '') continue;

      const memberId = memberMap.get(name.trim());
      if (!memberId) {
          errors.push({ type: "member_not_found", name, sheet: mapping.sheetName });
          continue;
      }

      const amountRaw = row[amountIdx];
      const amount = parseFloat(amountRaw);
      if (isNaN(amount)) continue;

      let payDate = new Date().toISOString();
      if (payDateIdx !== -1 && row[payDateIdx]) {
          const parsed = excelDateToJSDate(row[payDateIdx]);
          if (parsed) payDate = parsed;
      }

      let endDate = null;
      if (endDateIdx !== -1 && row[endDateIdx]) {
         endDate = excelDateToJSDate(row[endDateIdx]);
      }

      const notes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]) : null;

      // Ensure Enrollment exists
      if (endDate) {
          const { data: existingEnv } = await insforge.database.from("SportsEnrollment")
            .select("id")
            .eq("memberId", memberId)
            .eq("sportId", sportId)
            .maybeSingle();

          if (!existingEnv) {
             const { error: err1 } = await insforge.database.from("SportsEnrollment").insert({
                 memberId,
                 sportId,
                 subscriptionStart: payDate,
                 subscriptionEnd: endDate,
                 monthlyFee: amount,
                 status: "active",
                 notes
             });
             if (err1) {
                 errors.push({ type: "insert_enrollment", name, error: err1 });
                 errorCount++;
                 continue;
             }
          }
      }

      // Check if this payment exists exactly for this date, member, amount to prevent duplicates
      const { data: existingPay } = await insforge.database.from("Payment")
        .select("id")
        .eq("memberId", memberId)
        .eq("amount", amount)
        .gte("date", payDate.split("T")[0] + "T00:00:00.000Z")
        .lte("date", payDate.split("T")[0] + "T23:59:59.999Z")
        .maybeSingle();

      if (!existingPay) {
          const { error: payErr } = await insforge.database.from("Payment").insert({
              memberId,
              sportId,
              date: payDate,
              endOfSubscriptionDate: endDate,
              paymentType: "subscription",
              category: "income",
              method: "cash", // default assumption for imported
              amount,
              notes
          });

          if (payErr) {
              errors.push({ type: "insert_payment", name, error: payErr });
              errorCount++;
          } else {
              successCount++;
          }
      }
    }
  }

  console.log(`Finished processing payments. Inserted: ${successCount}, Errors: ${errorCount}`);
  fs.writeFileSync("import_payments_errors.json", JSON.stringify(errors, null, 2));
}

run().catch(console.error);
