"use client";

import { useEffect, useState } from "react";
import { Medal, Search, Loader2 } from "lucide-react";
import { insforge } from "@/lib/insforge/client";

/* ─── Belt color mapping ─── */
const BELT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "أبيض":  { bg: "bg-white",        text: "text-gray-800",  border: "border-gray-300",  dot: "#e5e7eb" },
  "أصفر":  { bg: "bg-yellow-50",    text: "text-yellow-800", border: "border-yellow-300", dot: "#facc15" },
  "برتقالي": { bg: "bg-orange-50",  text: "text-orange-800", border: "border-orange-300", dot: "#f97316" },
  "أخضر":  { bg: "bg-green-50",     text: "text-green-800",  border: "border-green-300",  dot: "#22c55e" },
  "أزرق":  { bg: "bg-blue-50",      text: "text-blue-800",   border: "border-blue-300",   dot: "#3b82f6" },
  "بني":   { bg: "bg-amber-50",     text: "text-amber-900",  border: "border-amber-400",  dot: "#92400e" },
  "بني 1": { bg: "bg-amber-50",     text: "text-amber-900",  border: "border-amber-400",  dot: "#92400e" },
  "بني 2": { bg: "bg-amber-50",     text: "text-amber-900",  border: "border-amber-400",  dot: "#78350f" },
  "بني 3": { bg: "bg-amber-50",     text: "text-amber-900",  border: "border-amber-400",  dot: "#451a03" },
  "أحمر":  { bg: "bg-red-50",       text: "text-red-800",    border: "border-red-300",    dot: "#ef4444" },
  "أسود":  { bg: "bg-gray-900",     text: "text-white",      border: "border-gray-700",   dot: "#111827" },
  "أسود 1": { bg: "bg-gray-900",    text: "text-white",      border: "border-gray-700",   dot: "#111827" },
  "أسود 2": { bg: "bg-gray-800",    text: "text-white",      border: "border-gray-600",   dot: "#1f2937" },
};

function getBeltStyle(beltName: string) {
  // Try exact match first, then partial match
  if (BELT_COLORS[beltName]) return BELT_COLORS[beltName];
  const key = Object.keys(BELT_COLORS).find(k => beltName?.includes(k));
  return key ? BELT_COLORS[key] : { bg: "bg-[#f8f5f0]", text: "text-gray-700", border: "border-gray-300", dot: "#6b7280" };
}

export default function BeltTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchTests(); }, []);

  async function fetchTests() {
    setLoading(true);
    const { data } = await insforge.database.from("BeltTest").select("*, Member(fullNameArabic), Sport(name)").order("date", { ascending: false });
    if (data) setTests(data);
    setLoading(false);
  }

  const filtered = tests.filter(t => t.Member?.fullNameArabic?.includes(search) || t.Sport?.name?.includes(search) || t.beltLevelTo?.includes(search));

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl" style={{background: "linear-gradient(135deg, #7a1b32, #c0392b)"}}><Medal className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الأحزمة والاختبارات</h1>
            <p className="mt-1 text-sm text-gray-500">إدارة اختبارات الأحزمة وترقيات الأعضاء</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input type="text" placeholder="ابحث باسم العضو أو الحزام..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] bg-white/80" />
          </div>
          <div className="text-sm font-medium bg-[#fdfaf6] px-4 py-1.5 rounded-lg text-gray-500">
             عدد: <span className="font-bold text-gray-800">{filtered.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{background: "linear-gradient(135deg, #7a1b32, #5c1425)"}}>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الرياضة</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ترقية إلى حزام</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" style={{color: "#7a1b32"}} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">لا توجد اختبارات</td></tr>
              ) : (
                filtered.map((test, idx) => {
                  const beltStyle = getBeltStyle(test.beltLevelTo || "");
                  return (
                    <tr key={test.id} className={`transition-all duration-200 hover:bg-blue-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-[#fdfaf6]/70"}`}>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-bold">{test.Member?.fullNameArabic || "غير محدد"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{test.Sport?.name || "غير محدد"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{test.date ? new Date(test.date).toLocaleDateString("ar-EG") : "-"}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}>
                          <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{backgroundColor: beltStyle.dot}} />
                          {test.beltLevelTo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${test.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {test.passed ? 'ناجح ✅' : 'راسب ❌'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{test.notes || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
