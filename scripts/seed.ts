import * as xlsx from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@insforge/sdk";

const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
});

const XLSX_PATH = path.join(process.cwd(), "2026-Al-Ahli-Martial-Arts-Academy.xlsx");

// Map sheet names → Sport names in DB
const SHEET_TO_SPORT: Record<string, string> = {
  "كاراتيه Karate": "Karate",
  "كيك بوكسينج KB": "Kickboxing",
  "جمباز GYM": "Gymnastics",
  "تايكوندو taekwondo": "Taekwondo",
  "جودو": "Judo",
  "Arnis": "Arnis",
};

const PAY_SHEET_MAPPING: Record<string, string> = {
  "اشتركات كاراتية Karate Pay": "Karate",
  "اشتراكات كيك بوكس KB Pay": "Kickboxing",
  "اشتراكات جمباز GYM Pay": "Gymnastics",
  "اشتراك تايكودوtaekwondo Payment": "Taekwondo",
  "اشتراكات جودو": "Judo",
};

// keywords that indicate a row is an expense
const EXPENSE_KEYWORDS = ["تاكسي", "مشروبات", "مياه", "مصروف", "عامل", "نظافة", "طعام", "ايجار", "صيانة", "كهرباء", "راتب", "مدرب"];

function toISODate(val: unknown): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  if (typeof val === "number") {
    try {
      const d = xlsx.SSF.parse_date_code(val);
      const m = String(d.m).padStart(2, "0");
      const day = String(d.d).padStart(2, "0");
      return `${d.y}-${m}-${day}`;
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

async function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error("❌ Excel file not found:", XLSX_PATH);
    process.exit(1);
  }

  console.log("📖 Reading Excel file...");
  const wb = xlsx.readFile(XLSX_PATH);
  console.log("📋 Sheets found:", wb.SheetNames.join(", "));

  // 1. Get Sport IDs from DB
  const { data: sports, error: sErr } = await insforge.database.from("Sport").select("id, name");
  if (sErr) { console.error("❌ Error fetching sports:", sErr); process.exit(1); }
  const sportIdMap: Record<string, string> = {};
  for (const s of sports ?? []) sportIdMap[s.name] = s.id;
  console.log("✅ Sports loaded:", Object.keys(sportIdMap).join(", "));

  // Member cache: fullNameArabic → id
  const memberCache: Record<string, string> = {};

  async function getOrCreateMember(arabicName: string, phone?: string): Promise<string> {
    const key = arabicName.trim();
    if (memberCache[key]) return memberCache[key];

    const { data: existing } = await insforge.database
      .from("Member").select("id").eq("fullNameArabic", key).limit(1);
    if (existing && existing.length > 0) {
      memberCache[key] = existing[0].id;
      return existing[0].id;
    }

    const { data: created, error } = await insforge.database.from("Member").insert([{
      fullNameArabic: key,
      phoneFather: phone ?? null,
      isSchoolProgram: false,
      isClubSon: false,
    }]).select("id").single();
    if (error) { console.error(`❌ Failed to create member ${key}:`, error); return ""; }
    if (!created) return "";
    memberCache[key] = created.id;
    console.log(`  ➕ Member: ${key}`);
    return created.id;
  }

  // 2. Process each sport sheet and pay sheets
  for (const sheetName of wb.SheetNames) {
    const mappedSport = SHEET_TO_SPORT[sheetName] || PAY_SHEET_MAPPING[sheetName];
    if (!mappedSport) continue;

    const isPaySheet = !!PAY_SHEET_MAPPING[sheetName];
    const sportId = sportIdMap[mappedSport];
    if (!sportId) continue;

    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName]);
    console.log(`\n📌 Processing [${sheetName}] → ${mappedSport} (${rows.length} rows)`);

    for (const row of rows) {
      const arabicName =
        (row["الاسم"] ?? row["اسم اللاعب"] ?? row["الاسم الکامل"] ?? row["الاسم الكامل"] ?? "")
          ?.toString().trim();
      if (!arabicName || arabicName === "" || arabicName === "الاسم") continue;

      const phone = (row["رقم الجوال"] ?? row["رقم التواصل"] ?? row["الهاتف"] ?? "")?.toString().trim();
      const memberId = await getOrCreateMember(arabicName, phone || undefined);
      if (!memberId) continue;

      // Enrollment & Subscription logic
      if (isPaySheet || row["تاريخ الاشتراك"] || row["من"]) {
        const subStart = toISODate(row["تاريخ الاشتراك"] ?? row["من"] ?? null);
        const subEnd = toISODate(row["تاريخ النهاية"] ?? row["إلى"] ?? row["الانتهاء"] ?? null);
        const fee = parseInt(String(row["الرسوم"] ?? row["القيمة"] ?? row["الاشتراك"] ?? "0").replace(/\D/g, "") || "0");

        const { data: existing } = await insforge.database
          .from("SportsEnrollment")
          .select("id")
          .eq("memberId", memberId)
          .eq("sportId", sportId)
          .limit(1);

        if (!existing || existing.length === 0) {
          const isActive = new Date(subEnd) > new Date();
          await insforge.database.from("SportsEnrollment").insert([{
            memberId,
            sportId,
            subscriptionStart: subStart,
            subscriptionEnd: subEnd,
            monthlyFee: fee,
            status: isActive ? "active" : "expired",
          }]);
        }
      }

      // Attendance logic (only on base sheets)
      if (!isPaySheet) {
        const dateColPattern = /^\d{1,2}-\d{1,2}$/;
        for (const col of Object.keys(row)) {
          if (!dateColPattern.test(col)) continue;
          const val = String(row[col] ?? "").trim();
          if (val === "1") {
            const [day, month] = col.split("-");
            const dateStr = `2026-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

            const { data: attEx } = await insforge.database
              .from("Attendance").select("id")
              .eq("memberId", memberId).eq("date", dateStr).limit(1);

            if (!attEx || attEx.length === 0) {
              await insforge.database.from("Attendance").insert([{
                memberId, sportId, date: dateStr, status: "present", source: "imported",
              }]);
            }
          }
        }
      }
    }
  }

  // 3. Payments sheet — "الحسابات All Payments "
  const paySheetName = "الحسابات All Payments ";
  const paySheet = wb.Sheets[paySheetName];
  if (paySheet) {
    const payRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(paySheet);
    console.log(`\n💰 Processing Payments sheet [${paySheetName}] (${payRows.length} rows)`);

    for (const row of payRows) {
      const amount = parseFloat(String(row["المبلغ"] ?? row["الكاش"] ?? row["القيمة"] ?? "0").replace(/[^\d.]/g, "") || "0");
      if (!amount || amount === 0) continue;

      const dateStr = toISODate(row["التاريخ"] ?? row["Date"] ?? null);
      const description = String(row["البيان"] ?? row["الوصف"] ?? row["Description"] ?? "").trim();
      const notesStr = String(row["ملاحظات"] ?? row["Notes"] ?? "").trim();
      const memberName = String(row["الاسم"] ?? row["العضو"] ?? "").trim();

      // Determine category
      const isExpense = EXPENSE_KEYWORDS.some(kw => description.includes(kw)) || notesStr.includes("مصروف");
      const category = isExpense ? "expense" : "income";

      // Determine method
      const methodRaw = String(row["طريقة الدفع"] ?? row["الطريقة"] ?? "").toLowerCase();
      let method = "cash";
      if (methodRaw.includes("تحويل") || methodRaw.includes("atm")) method = "transferATM";
      else if (methodRaw.includes("بنك") || methodRaw.includes("ايداع") || methodRaw.includes("إيداع")) method = "bankDeposit";
      else if (methodRaw.includes("شبكة") || methodRaw.includes("ماكينة") || methodRaw.includes("card")) method = "cardMachine";

      // Determine paymentType
      let paymentType = "other";
      if (description.includes("اشتراك")) paymentType = "subscription";
      else if (description.includes("حزام") || description.includes("بيلت")) paymentType = "belt";
      else if (description.includes("ملابس") || description.includes("زي")) paymentType = "uniform";
      else if (description.includes("خاص") || description.includes("private")) paymentType = "privateSession";
      else if (isExpense) paymentType = "other";

      // Try to link to member
      let memberId: string | null = null;
      if (memberName) {
        const { data: mem } = await insforge.database
          .from("Member").select("id").eq("fullNameArabic", memberName).limit(1);
        if (mem && mem.length > 0) memberId = mem[0].id;
      }

      // Avoid duplicate: same member+date+amount
      const { data: dupCheck } = await insforge.database
        .from("Payment").select("id")
        .eq("date", dateStr).eq("amount", amount)
        .limit(1);
      if (dupCheck && dupCheck.length > 0) continue;

      await insforge.database.from("Payment").insert([{
        memberId,
        date: dateStr,
        paymentType,
        category,
        method,
        amount,
        description: description || null,
        notes: notesStr || null,
      }]);
    }
  }

  console.log("\n✅ Seeding complete!");
}

main().catch(e => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
