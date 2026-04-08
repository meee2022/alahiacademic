"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, TrendingUp, TrendingDown, Users, DollarSign, Calendar, Download } from "lucide-react";
import { getDashboardStats } from "@/lib/insforge/queries";

const MONTH_NAMES: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر"
};

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load stats", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const sortedMonths = stats?.monthlyData
    ? Object.entries(stats.monthlyData).sort(([a], [b]) => a.localeCompare(b))
    : [];

  const handleExport = () => {
    if (!sortedMonths.length) return;
    const headers = ["الشهر", "الإيرادات", "المصروفات", "الصافي"];
    const rows = sortedMonths.map(([month, data]: any) => {
      const [y, m] = month.split("-");
      return [`${MONTH_NAMES[m] || m} ${y}`, data.income, data.expenses, data.income - data.expenses];
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `تقرير_مالي_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl" style={{background: "linear-gradient(135deg, #7a1b32, #c0392b)"}}>
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
            <p className="mt-1 text-sm text-gray-500">نظرة شاملة على أداء الأكاديمية المالي والإداري</p>
          </div>
        </div>
        {!loading && (
          <button onClick={handleExport} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 font-medium" style={{background: "linear-gradient(135deg, #7a1b32, #c0392b)"}}>
            <Download className="h-4 w-4" />
            تصدير التقرير
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/60">
          <Loader2 className="h-10 w-10 animate-spin" style={{color: "#7a1b32"}} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">إجمالي الأعضاء</p>
                <h3 className="text-3xl font-extrabold">{stats?.membersCount || 0}</h3>
              </div>
              <div className="p-4 bg-white/20 rounded-xl"><Users className="h-8 w-8 text-white" /></div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl text-white shadow-xl shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">إجمالي الإيرادات</p>
                <h3 className="text-3xl font-extrabold">{stats?.totalIncome?.toLocaleString() || 0} <span className="text-sm font-normal text-white/70">ر.ق</span></h3>
              </div>
              <div className="p-4 bg-white/20 rounded-xl"><TrendingUp className="h-8 w-8 text-white" /></div>
            </div>
            <div className="p-6 rounded-2xl text-white shadow-xl shadow-[#7a1b32]/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between" style={{background: "linear-gradient(135deg, #7a1b32, #5c0e26)"}}>
              <div>
                <p className="text-sm text-white/80 mb-1">صافي الربح</p>
                <h3 className="text-3xl font-extrabold">{stats?.netProfit?.toLocaleString() || 0} <span className="text-sm font-normal text-white/70">ر.ق</span></h3>
              </div>
              <div className="p-4 bg-white/20 rounded-xl"><DollarSign className="h-8 w-8 text-white" /></div>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <Calendar className="h-5 w-5" style={{color: "#7a1b32"}} />
              <h2 className="text-lg font-bold text-gray-900">التقرير المالي الشهري</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{background: "linear-gradient(135deg, #7a1b32, #5c1425)"}}>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الشهر</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الإيرادات</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">المصروفات</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الصافي</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">مؤشر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedMonths.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">لا توجد بيانات مالية بعد</td></tr>
                  ) : (
                    sortedMonths.map(([month, data]: any, idx) => {
                      const [y, m] = month.split("-");
                      const net = data.income - data.expenses;
                      return (
                        <tr key={month} className={`transition-all duration-200 hover:bg-blue-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-[#fdfaf6]/70"}`}>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{background: "#7a1b32"}} />
                              {MONTH_NAMES[m] || m} {y}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                            +{data.income.toLocaleString()} ر.ق
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-rose-600">
                            -{data.expenses.toLocaleString()} ر.ق
                          </td>
                          <td className="px-6 py-4 text-sm font-extrabold" style={{color: net >= 0 ? "#059669" : "#e11d48"}}>
                            {net >= 0 ? "+" : ""}{net.toLocaleString()} ر.ق
                          </td>
                          <td className="px-6 py-4">
                            {net >= 0 ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-max">
                                <TrendingUp className="h-3.5 w-3.5" /> ربح
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full w-max">
                                <TrendingDown className="h-3.5 w-3.5" /> خسارة
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {sortedMonths.length > 0 && (
                  <tfoot>
                    <tr style={{background: "linear-gradient(135deg, #f0f4f8, #e2e8f0)"}}>
                      <td className="px-6 py-4 text-sm font-extrabold text-gray-900">الإجمالي</td>
                      <td className="px-6 py-4 text-sm font-extrabold text-emerald-700">+{stats.totalIncome.toLocaleString()} ر.ق</td>
                      <td className="px-6 py-4 text-sm font-extrabold text-rose-700">-{stats.totalExpenses.toLocaleString()} ر.ق</td>
                      <td className="px-6 py-4 text-sm font-extrabold" style={{color: stats.netProfit >= 0 ? "#059669" : "#e11d48"}}>{stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toLocaleString()} ر.ق</td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Per-Sport Members */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <Users className="h-5 w-5" style={{color: "#7a1b32"}} />
              <h2 className="text-lg font-bold text-gray-900">توزيع الأعضاء حسب الرياضة</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{background: "linear-gradient(135deg, #7a1b32, #5c1425)"}}>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">الرياضة</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">عدد المشتركين</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">النسبة</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">مؤشر بصري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(stats.sportCounts).map(([sport, count]: any, idx) => {
                    const pct = Math.round((count / stats.membersCount) * 100);
                    return (
                      <tr key={sport} className={`transition-all duration-200 hover:bg-blue-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-[#fdfaf6]/70"}`}>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{sport}</td>
                        <td className="px-6 py-4 text-sm font-bold" style={{color: "#7a1b32"}}>{count}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{pct}%</td>
                        <td className="px-6 py-4">
                          <div className="w-full max-w-[200px] bg-[#f8f5f0] rounded-full h-3">
                            <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7a1b32, #c0392b)" }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
