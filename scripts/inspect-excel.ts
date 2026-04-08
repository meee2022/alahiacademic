import * as xlsx from "xlsx";
import * as path from "path";

const filePath = path.join(process.cwd(), "2026-Al-Ahli-Martial-Arts-Academy.xlsx");
const workbook = xlsx.readFile(filePath);

console.log("=== SHEET NAMES ===");
console.log(workbook.SheetNames);
console.log("\n");

for (const name of workbook.SheetNames) {
  const rows = xlsx.utils.sheet_to_json<any>(workbook.Sheets[name], { header: 1 });
  // Print sheet name and first 3 rows (headers + data preview)
  console.log(`\n=== SHEET: ${name} ===`);
  console.log("First 3 rows:");
  rows.slice(0, 3).forEach((row: any[], i: number) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
  });
}
