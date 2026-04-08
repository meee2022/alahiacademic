import * as XLSX from "xlsx";
import fs from "fs";

try {
  const buf = fs.readFileSync("2026-Al-Ahli-Martial-Arts-Academy.xlsx");
  const workbook = XLSX.read(buf, { type: "buffer" });
  const result = {};

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 3);
    result[sheetName] = data;
  }

  fs.writeFileSync("excel_structure.json", JSON.stringify(result, null, 2));
  console.log("Extracted Excel structure");
} catch (e) {
  console.error("Error reading Excel file:", e.message);
}
