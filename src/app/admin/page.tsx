import { getDashboardStats } from "@/lib/insforge/queries";
import { insforge } from "@/lib/insforge/client";
import { Users, PhilippinePeso, ArrowDownToLine, ArrowUpToLine, Trophy, TrendingUp, Activity, CalendarDays, Plus } from "lucide-react";
import ExpiringSubscriptionsWidget from "./components/ExpiringSubscriptionsWidget";

// Sport color map for the per-sport cards
const sportColors: Record<string, { gradient: string; shadow: string }> = {
  Karate: { gradient: "from-red-500 to-red-700", shadow: "shadow-red-500/20" },
  Taekwondo: { gradient: "from-sky-500 to-sky-700", shadow: "shadow-sky-500/20" },
  Gymnastics: { gradient: "from-pink-500 to-pink-700", shadow: "shadow-pink-500/20" },
  Kickboxing: { gradient: "from-orange-500 to-orange-700", shadow: "shadow-orange-500/20" },
  Judo: { gradient: "from-teal-500 to-teal-700", shadow: "shadow-teal-500/20" },
  Wrestling: { gradient: "from-lime-600 to-lime-800", shadow: "shadow-lime-600/20" },
  Arnis: { gradient: "from-indigo-500 to-indigo-700", shadow: "shadow-indigo-500/20" },
};

const defaultColor = { gradient: "from-gray-500 to-gray-700", shadow: "shadow-gray-500/20" };

export default async function AdminDashboard() {
  const data = await getDashboardStats();

  // Fetch expiring subscriptions (ending within 14 days)
  const today = new Date();
  const fourteenDaysLater = new Date(today);
  fourteenDaysLater.setDate(today.getDate() + 14);

  const { data: expiringRaw } = await insforge.database
    .from("SportsEnrollment")
    .select("*, Member(fullNameArabic), Sport(name)")
    .eq("status", "active")
    .lte("subscriptionEnd", fourteenDaysLater.toISOString().split("T")[0])
    .gte("subscriptionEnd", today.toISOString().split("T")[0])
    .order("subscriptionEnd", { ascending: true })
    .limit(100);

  const expiring = expiringRaw || [];

  const stats = [
    {
      name: "إجمالي الأعضاء",
      value: data.membersCount.toString(),
      icon: Users,
      trend: "من قاعدة البيانات",
      isPositive: true,
    },
    {
      name: "إجمالي الإيرادات",
      value: `${data.totalIncome.toLocaleString()} ر.ق`,
      icon: ArrowUpToLine,
      trend: "إجمالي الدخل",
      isPositive: true,
    },
    {
      name: "صافي الربح",
      value: `${data.netProfit.toLocaleString()} ر.ق`,
      icon: PhilippinePeso,
      trend: "مستقر",
      isPositive: true,
    },
    {
      name: "حضور اليوم",
      value: data.todayPresent.toString(),
      icon: Activity,
      trend: "لا يوجد بيانات للرصد",
      isPositive: false,
    },
    {
      name: "مصروفات مسجلة",
      value: `${data.totalExpenses.toLocaleString()} ر.ق`,
      icon: ArrowDownToLine,
      trend: "إجمالي الخارج",
      isPositive: false,
    },
    {
      name: "غياب اليوم",
      value: data.todayAbsent.toString(),
      icon: Activity,
      trend: "عدد الغائبين",
      isPositive: false,
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-[#670024] tracking-tight">أهلاً بك في لوحة القيادة</h1>
          <p className="text-gray-500 text-base font-medium">
            نظرة عامة على أداء أكاديمية النادي الأهلي اليوم.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#f4f4f5] text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold">
            <CalendarDays className="h-5 w-5 text-[#670024]" />
            <span>اليوم، {new Date().toLocaleDateString("ar-EG", { day: 'numeric', month: 'long' })}</span>
          </div>
          <button className="flex items-center gap-2 bg-[#670024] hover:bg-[#52001c] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[inset_0_0_10px_rgba(119,90,25,0)] hover:shadow-[inset_0_0_15px_rgba(119,90,25,0.4)]">
            <Plus className="h-5 w-5" />
            <span>إضافة عضو</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-[16px] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border-r-[3px] border-[#775a19] flex flex-col justify-between relative hover:-translate-y-1 transition-transform cursor-default min-h-[120px]"
          >
            <div className="absolute top-4 left-4 bg-[#670024]/5 p-2 rounded-lg">
              <stat.icon className="h-4 w-4 text-[#670024]" aria-hidden="true" />
            </div>
            <div className="space-y-0.5 mt-1 pr-1">
              <p className="text-[11px] font-semibold text-gray-500">{stat.name}</p>
              <p className="text-xl font-bold text-[#670024] tracking-tight">{stat.value}</p>
            </div>
            
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${stat.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {stat.isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <Activity className="h-2.5 w-2.5" />}
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8 border-r-4 border-[#775a19] pr-3">
            <h3 className="text-xl font-bold text-[#670024]">تفاصيل الإيرادات السنوية</h3>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {[40, 60, 30, 80, 50, 90, 40, 65, 55].map((height, i) => (
              <div key={i} className="w-full flex justify-center group relative">
                <div 
                  className={`w-full max-w-[24px] rounded-t-lg transition-all duration-500 ${i === 5 ? 'bg-[#670024]' : i === 3 ? 'bg-[#775a19]' : 'bg-[#e5e0e2] group-hover:bg-[#d6cbce]'}`} 
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-semibold text-gray-400 px-4">
            <span>يناير</span>
            <span>فبراير</span>
            <span>مارس</span>
            <span>أبريل</span>
            <span className="text-[#670024] font-bold">مايو</span>
            <span>يونيو</span>
            <span>يوليو</span>
            <span>أغسطس</span>
          </div>
        </div>

        {/* Sports Breakdown */}
        <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8 border-r-4 border-[#775a19] pr-3">
            <h3 className="text-xl font-bold text-[#670024]">توزيع الرياضات</h3>
          </div>
          <div className="space-y-6">
            {Object.entries(data.sportCounts).map(([sport, count], index) => {
              const pct = Math.round(((count as number) / data.membersCount) * 100) || 0;
              const isPrimary = index % 2 === 0;
              return (
                <div key={sport}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-[#670024]">{sport}</span>
                    <span className="text-gray-500 font-medium">{count as number} عضو</span>
                  </div>
                  <div className="w-full bg-[#f9f9fb] rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${isPrimary ? 'bg-[#670024]' : 'bg-[#775a19]'}`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions Alert */}
      {expiring.length > 0 && (
        <ExpiringSubscriptionsWidget expiring={expiring} sports={data.sports} />
      )}
    </div>
  );
}
