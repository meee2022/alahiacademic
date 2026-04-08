import * as XLSX from "xlsx";
import fs from "fs";
import { createClient } from "@insforge/sdk";

// Initialize the InsForge client
const insforge = createClient({
  baseUrl: "https://pzqe7ma6.ap-southeast.insforge.app",
  anonKey: "ik_1dce07713f32acb6714f601e6a2f8554",
  global: {
    headers: {
      Authorization: `Bearer ik_1dce07713f32acb6714f601e6a2f8554` // Admin key for bypass RLS
    }
  }
});

const fileName = "2026-Al-Ahli-Martial-Arts-Academy.xlsx";

function processMembers() {
  const buf = fs.readFileSync(fileName);
  const workbook = XLSX.read(buf, { type: "buffer" });

  const sportsMap = [
    { sheetName: "كاراتيه Karate", sportName: "Karate" },
    { sheetName: "كيك بوكسينج KB", sportName: "Kickboxing" },
    { sheetName: "جمباز GYM", sportName: "Gymnastics" },
    { sheetName: "كريز", sportName: "Karate" }, // Assuming kids karate
    { sheetName: "تايكوندو taekwondo", sportName: "Taekwondo" },
    { sheetName: "جودو", sportName: "Judo" }
  ];

  const parsedMembers = [];

  for (const mapping of sportsMap) {
    const sheet = workbook.Sheets[mapping.sheetName];
    if (!sheet) {
      console.warn(`Sheet ${mapping.sheetName} not found`);
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find header row (usually row 1 or 2)
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        if (rows[i] && rows[i].includes("الاسماء") || rows[i].includes("الاسم")) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
      console.warn(`Could not find header row in sheet ${mapping.sheetName}`);
      continue;
    }

    const headers = rows[headerRowIdx];
    
    // Find column indexes
    const nameEngIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes("NAME") || h.includes("Names")));
    const nameArIdx = headers.findIndex((h) => typeof h === 'string' && (h.includes("الاسماء") || h.includes("الاسم")));
    const dadPhoneIdx = headers.findIndex((h) => typeof h === 'string' && (h.toLowerCase().includes("dad") || h.includes("DAD")));
    const momPhoneIdx = headers.findIndex((h) => typeof h === 'string' && (h.toLowerCase().includes("mom") || h.toLowerCase().includes("mam")));
    
    // Data starts after header
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const arabicName = nameArIdx !== -1 ? row[nameArIdx] : null;
      if (!arabicName || typeof arabicName !== 'string' || arabicName.trim() === '') continue;

      const englishName = nameEngIdx !== -1 ? row[nameEngIdx] : null;
      const dadPhone = dadPhoneIdx !== -1 ? row[dadPhoneIdx] : null;
      const momPhone = momPhoneIdx !== -1 ? row[momPhoneIdx] : null;

      parsedMembers.push({
        fullNameArabic: arabicName.trim(),
        fullNameEnglish: typeof englishName === 'string' ? englishName.trim() : null,
        phoneFather: dadPhone ? String(dadPhone).trim() : null,
        phoneMother: momPhone ? String(momPhone).trim() : null,
        sportName: mapping.sportName,
        sourceSheet: mapping.sheetName
      });
    }
  }

  console.log(`Parsed ${parsedMembers.length} members`);
  fs.writeFileSync("parsed_members.json", JSON.stringify(parsedMembers, null, 2));
}

processMembers();
