"use client";

import { useEffect, useState } from "react";
import { insforge } from "@/lib/insforge/client";
import { Loader2, TrendingUp, Users, DollarSign, Calendar, ChevronLeft, ChevronRight, Printer } from "lucide-react";

interface CoachSalaryReport {
  coachId: string;
  fullName: string;
  phone: string | null;
  sportId: string | null;
  sportName: string;
  baseSalary: number;
  percentage: number;
  totalSportRevenue: number;
  commission: number;
  finalSalary: number;
}

export default function CoachSalaryPage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<CoachSalaryReport[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);

  const monthNames = [
    "يناير","فبراير","مارس","أبريل","مايو","يونيو",
    "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
  ];

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  async function fetchReport() {
    setLoading(true);
    try {
      // Build date range for selected month
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${lastDay}`;

      // Fetch coaches with their sport
      const { data: coachesData } = await insforge.database
        .from("Coach")
        .select("id, fullName, phone, sportId, baseSalary, CoachsalaryPercentage, Sport(id, name)")
        .order("fullName");

      // Fetch only SUBSCRIPTION income payments for selected month
      // (exclude belts, uniforms, and other types from commission calculation)
      const { data: paymentsData } = await insforge.database
        .from("Payment")
        .select("sportId, amount, paymentType")
        .eq("category", "income")
        .eq("paymentType", "subscription")
        .gte("date", startDate)
        .lte("date", endDate);

      // Build revenue map: sportId → total income
      const revenueMap: Record<string, number> = {};
      let totalRev = 0;
      (paymentsData || []).forEach((p: any) => {
        if (p.sportId) {
          revenueMap[p.sportId] = (revenueMap[p.sportId] || 0) + Number(p.amount);
        }
        totalRev += Number(p.amount);
      });
      setTotalRevenue(totalRev);

      // Build reports for each coach
      let totalComm = 0;
      const reportList: CoachSalaryReport[] = (coachesData || []).map((coach: any) => {
        const sportId = coach.sportId || "";
        const sportName = coach.Sport?.name || "غير محدد";
        const baseSalary = Number(coach.baseSalary || 0);
        const percentage = Number(coach.CoachsalaryPercentage || 0);
        const totalSportRevenue = sportId ? (revenueMap[sportId] || 0) : 0;
        const commission = Math.round((totalSportRevenue * percentage) / 100);
        const finalSalary = baseSalary + commission;
        totalComm += commission;

        return {
          coachId: coach.id,
          fullName: coach.fullName,
          phone: coach.phone,
          sportId,
          sportName,
          baseSalary,
          percentage,
          totalSportRevenue,
          commission,
          finalSalary,
        };
      });

      setReports(reportList);
      setTotalCommissions(totalComm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-6 px-4 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-[#5A0B1A]">تقرير رواتب المدربين</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">يُحسب تلقائياً بناءً على إيرادات كل رياضة</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#5A0B1A] text-white rounded-xl font-bold hover:bg-[#7a1b32] transition-colors shadow-md text-sm"
        >
          <Printer className="w-4 h-4" /> طباعة التقرير
        </button>
      </div>

      {/* Print Header (hidden on screen) */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-gray-100 pb-4">
        <h1 className="text-2xl font-black text-[#5A0B1A]">تقرير رواتب المدربين الشهري</h1>
        <p className="text-gray-500 font-bold text-sm mt-1">{monthNames[selectedMonth - 1]} {selectedYear}</p>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm transition-colors print:hidden">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <div className="bg-[#5A0B1A] text-white px-8 py-3 rounded-2xl font-black text-lg shadow-md min-w-[180px] text-center">
          {monthNames[selectedMonth - 1]} {selectedYear}
        </div>
        <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm transition-colors print:hidden">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-r-4 border-[#a0743b] print:shadow-none print:border print:border-gray-200">
          <div className="text-gray-500 text-sm font-medium mb-1">إجمالي الإيرادات</div>
          <div className="text-3xl font-black text-gray-900">{totalRevenue.toLocaleString()}</div>
          <div className="text-xs font-bold text-[#a0743b] mt-1">ر.ق</div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-r-4 border-purple-500 print:shadow-none print:border print:border-gray-200">
          <div className="text-gray-500 text-sm font-medium mb-1">إجمالي العمولات</div>
          <div className="text-3xl font-black text-gray-900">{totalCommissions.toLocaleString()}</div>
          <div className="text-xs font-bold text-purple-600 mt-1">ر.ق</div>
        </div>
        <div className="bg-[#5A0B1A] rounded-3xl p-5 shadow-xl text-white print:shadow-none">
          <div className="text-white/70 text-sm font-medium mb-1">عدد المدربين</div>
          <div className="text-3xl font-black">{reports.length}</div>
          <div className="text-xs font-bold text-[#c19951] mt-1">مدرب نشط</div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#5A0B1A]" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 text-sm font-bold">
          لا يوجد مدربون مسجلون في النظام
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden print:shadow-none print:border print:border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-2 px-6 py-4 bg-[#fdfaf6] border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center print:bg-gray-50">
            <div className="text-right">المدرب</div>
            <div>الرياضة</div>
            <div>إيرادات الرياضة</div>
            <div>النسبة %</div>
            <div>العمولة</div>
            <div>الراتب الأساسي</div>
            <div className="text-[#5A0B1A]">الراتب النهائي</div>
          </div>

          {/* Table Rows */}
          {reports.map((r, i) => (
            <div
              key={r.coachId}
              className={`grid grid-cols-7 gap-2 px-6 py-4 items-center text-center border-b border-gray-50 last:border-none transition-colors hover:bg-[#fdfcfa] print:py-3 print:border-gray-200 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
            >
              {/* Name */}
              <div className="text-right">
                <div className="font-bold text-gray-900 text-sm">{r.fullName}</div>
                {r.phone && <div className="text-xs text-gray-400 font-mono mt-0.5" dir="ltr">{r.phone}</div>}
              </div>

              {/* Sport */}
              <div>
                <span className="inline-block bg-[#fcecc2] text-[#8A1538] text-xs font-bold px-2.5 py-1 rounded-full">
                  {r.sportName}
                </span>
              </div>

              {/* Sport Revenue */}
              <div>
                {r.sportId ? (
                  <span className="font-bold text-gray-700 text-sm">{r.totalSportRevenue.toLocaleString()} <span className="text-xs text-gray-400">ر.ق</span></span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>

              {/* Percentage */}
              <div>
                {r.percentage > 0 ? (
                  <span className="inline-block bg-purple-50 text-purple-700 font-black text-sm px-3 py-1 rounded-lg">
                    {r.percentage}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">0%</span>
                )}
              </div>

              {/* Commission */}
              <div>
                <span className={`font-bold text-sm ${r.commission > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                  {r.commission.toLocaleString()} <span className="text-xs opacity-70">ر.ق</span>
                </span>
              </div>

              {/* Base Salary */}
              <div>
                <span className="font-medium text-sm text-gray-600">
                  {r.baseSalary.toLocaleString()} <span className="text-xs text-gray-400">ر.ق</span>
                </span>
              </div>

              {/* Final Salary */}
              <div>
                <div className={`inline-block px-4 py-2 rounded-xl font-black text-sm ${r.finalSalary > 0 ? "bg-[#5A0B1A] text-white shadow-sm" : "bg-gray-100 text-gray-500"}`}>
                  {r.finalSalary.toLocaleString()} ر.ق
                </div>
              </div>
            </div>
          ))}

          {/* Footer Total Row */}
          <div className="grid grid-cols-7 gap-2 px-6 py-4 items-center text-center bg-[#fdfaf6] border-t-2 border-gray-100 font-black print:border-gray-300">
            <div className="text-right text-sm text-gray-700">الإجمالي</div>
            <div></div>
            <div className="text-sm text-gray-700">{totalRevenue.toLocaleString()} ر.ق</div>
            <div></div>
            <div className="text-sm text-emerald-600">{totalCommissions.toLocaleString()} ر.ق</div>
            <div className="text-sm text-gray-700">{reports.reduce((a, r) => a + r.baseSalary, 0).toLocaleString()} ر.ق</div>
            <div className="text-[#5A0B1A] text-sm">{reports.reduce((a, r) => a + r.finalSalary, 0).toLocaleString()} ر.ق</div>
          </div>
        </div>
      )}

      {/* Formula Note */}
      <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 print:hidden">
        <p className="font-bold mb-1">📊 طريقة الحساب:</p>
        <p><strong>العمولة</strong> = إجمالي إيرادات <span className="underline">الاشتراكات فقط</span> × (النسبة ÷ 100)</p>
        <p><strong>الراتب النهائي</strong> = الراتب الأساسي + العمولة</p>
        <p className="text-xs mt-2 text-amber-500">* لا تُحسب مدفوعات الأحزمة أو الملابس أو غيرها ضمن العمولة — الاشتراكات فقط.</p>
      </div>

      <style>{`
        @media print {
          @page { margin: 20px; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
