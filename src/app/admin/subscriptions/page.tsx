"use client";

import { useEffect, useState } from "react";
import { CreditCard, Search, Loader2, Users, Edit, X, Save, RefreshCw, Printer, Trash2 } from "lucide-react";
import { insforge } from "@/lib/insforge/client";
import { deleteSubscription } from "@/lib/insforge/queries";
import { useRouter } from "next/navigation";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [form, setForm] = useState({ subscriptionStart: "", subscriptionEnd: "", monthlyFee: "", status: "active", coachId: "" });
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<any[]>([]);
  const router = useRouter();

  const handlePrintReceipt = async (sub: any) => {
    setPrintingId(sub.id);
    try {
      const { data, error } = await insforge.database
        .from("Payment")
        .select("id")
        .eq("memberId", sub.memberId)
        .eq("sportId", sub.sportId)
        .order("date", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        router.push(`/receipt/${data[0].id}`);
      } else {
        const { data: globalData } = await insforge.database
          .from("Payment")
          .select("id")
          .eq("memberId", sub.memberId)
          .order("date", { ascending: false })
          .limit(1);
        if (globalData && globalData.length > 0) {
           router.push(`/receipt/${globalData[0].id}`);
        } else {
           // Fallback to enrollment-based receipt if no formal payment was found
           router.push(`/admin/receipts/enrollment/${sub.id}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء جلب بيانات الإيصال");
    } finally {
      setPrintingId(null);
    }
  };

  const handleDeleteSub = async (sub: any) => {
    if (window.confirm("تحذير: هل أنت متأكد من حذف هذا الاشتراك؟ سيتم حذفه من قاعدة البيانات نهائياً.")) {
      try {
        await deleteSubscription(sub.id);
        fetchData();
      } catch (err: any) {
        console.error("Delete Error", err);
        alert("حدث خطأ أثناء الحذف: " + (err?.message || ""));
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: sportsData } = await insforge.database.from("Sport").select("id, name").eq("isActive", true);
    if (sportsData) setSports(sportsData);
    const { data } = await insforge.database.from("SportsEnrollment").select("*, Member(fullNameArabic, photoUrl), Sport(id, name)").order("subscriptionEnd", { ascending: true });
    if (data) setSubscriptions(data);
    // Fetch coaches
    const { data: coachesData } = await insforge.database.from("Coach").select("id, fullName, sportId, CoachsalaryPercentage").order("fullName");
    if (coachesData) setCoaches(coachesData);
    setLoading(false);
  }

  const filtered = subscriptions.filter(sub => {
    const matchesSearch = sub.Member?.fullNameArabic?.includes(search) || sub.Sport?.name?.includes(search);
    let matchesStatus = true;
    
    // Status computation
    const today = new Date();
    const end = sub.subscriptionEnd ? new Date(sub.subscriptionEnd) : null;
    let computedStatus = sub.status;
    let isExpiringSoon = false;

    if (end && sub.status === 'active') {
       const diffTime = end.getTime() - today.getTime();
       const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
       if (daysLeft > 0 && daysLeft <= 7) isExpiringSoon = true;
       if (daysLeft < 0) computedStatus = 'expired';
    }

    if (activeTab === "active") matchesStatus = computedStatus === "active" && !isExpiringSoon;
    if (activeTab === "expired") matchesStatus = computedStatus === "expired";
    if (activeTab === "expiring_soon") matchesStatus = isExpiringSoon;

    return matchesSearch && matchesStatus;
  });

  const openEdit = (sub: any) => {
    setEditingSub(sub);
    setForm({
      subscriptionStart: sub.subscriptionStart || "",
      subscriptionEnd: sub.subscriptionEnd || "",
      monthlyFee: sub.monthlyFee?.toString() || "",
      status: sub.status || "active",
      coachId: sub.coachId || ""
    });
    setShowModal(true);
  };

  const handleRenew = (sub: any) => {
    setEditingSub(sub);
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 30);
    setForm({
      subscriptionStart: today.toISOString().split("T")[0],
      subscriptionEnd: end.toISOString().split("T")[0],
      monthlyFee: sub.monthlyFee?.toString() || "",
      status: "active",
      coachId: ""
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingSub) return;
    setSaving(true);
    try {
      const { error } = await insforge.database.from("SportsEnrollment").update({
        subscriptionStart: form.subscriptionStart || null,
        subscriptionEnd: form.subscriptionEnd || null,
        monthlyFee: form.monthlyFee ? Number(form.monthlyFee) : null,
        status: form.status,
        coachId: form.coachId || null
      }).eq("id", editingSub.id);
      if (error) throw error;
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Premium Editorial Header */}
      <div className="flex flex-col items-center justify-center text-center mt-4 mb-10">
        <span className="text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-4">
          Academy Management
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary leading-tight flex flex-col items-center gap-1">
          إدارة الاشتراكات
          <span className="text-secondary text-3xl md:text-4xl">للموسم الحالي</span>
        </h1>
      </div>

      {/* Standard Search Bar */}
      <div className="relative max-w-2xl mx-auto -mt-4 mb-4">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="ابحث باسم العضو أو الرياضة..."
          className="w-full pl-6 pr-12 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-sm text-gray-900 font-medium transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap justify-center gap-3">
        {[
          { id: "all", label: "الكل" },
          { id: "active", label: "نشط" },
          { id: "expired", label: "منتهي" },
          { id: "expiring_soon", label: "ينتهي قريباً" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all border ${
              activeTab === tab.id 
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                : "bg-white text-primary border-primary/20 hover:border-primary/40 hover:bg-rose-50/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscription Cards Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 text-gray-500 font-medium">
          لا توجد اشتراكات مطابقة لهذا التصنيف
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(sub => {
            const today = new Date();
            const end = sub.subscriptionEnd ? new Date(sub.subscriptionEnd) : null;
            let status = sub.status;
            let isExpiringSoon = false;
            if (end && sub.status === 'active') {
               const diffTime = end.getTime() - today.getTime();
               const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
               if (daysLeft > 0 && daysLeft <= 7) isExpiringSoon = true;
               if (daysLeft < 0) status = 'expired';
            }

            // Determine border color based loosely on status to mimic design or keep standard Gold
            const isExpired = status === 'expired';
            const statusConfig = {
              "active": { text: "مفعل", class: "bg-[#F3F6F4] text-[#4F7C5B]", border: "border-secondary" },
              "expired": { text: "منتهي", class: "bg-rose-50 text-rose-600", border: "border-primary" },
              "frozen": { text: "مجمد", class: "bg-gray-100 text-gray-600", border: "border-gray-400" },
              "expiring_soon": { text: "ينتهي قريباً", class: "bg-orange-50 text-orange-600", border: "border-secondary" }
            };

            const currentStatus = isExpiringSoon ? statusConfig.expiring_soon : statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

            return (
              <div key={sub.id} className={`bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-y border-l border-gray-100 border-r-[6px] ${currentStatus.border} flex flex-col relative overflow-hidden transition-transform duration-300 hover:-translate-y-1`}>
                
                {/* Top Section: Avatar & Info */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4 items-center">
                    <div className="h-[60px] w-[60px] rounded-full bg-gradient-to-br from-[#F5F5F7] to-gray-200 border-[3px] border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                      {sub.Member?.photoUrl && sub.Member.photoUrl !== "undefined" ? (
                        <img src={sub.Member.photoUrl} alt="صورة العضو" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-primary leading-tight mb-1">{sub.Member?.fullNameArabic || "غير محدد"}</h3>
                      <div className="flex items-center gap-1.5 text-secondary text-xs font-bold">
                        <span>🤸</span>
                        <span>{sub.Sport?.name || "غير محدد"}</span>
                        <span className="text-gray-400 font-normal">- المستوى الأول</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold shrink-0 ${currentStatus.class}`}>
                    {currentStatus.text}
                  </span>
                </div>

                {/* Dates Section */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-[#F9F9FB] rounded-2xl p-4 text-center">
                    <span className="text-[10px] text-gray-400 font-bold mb-1.5 block">بداية الاشتراك</span>
                    <span className="text-sm font-extrabold text-primary">
                      {sub.subscriptionStart ? new Date(sub.subscriptionStart).toLocaleDateString("ar-EG", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                    </span>
                  </div>
                  <div className="bg-[#F9F9FB] rounded-2xl p-4 text-center">
                    <span className="text-[10px] text-rose-400 font-bold mb-1.5 block">نهاية الاشتراك</span>
                    <span className="text-sm font-extrabold text-primary">
                      {sub.subscriptionEnd ? new Date(sub.subscriptionEnd).toLocaleDateString("ar-EG", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                    </span>
                  </div>
                </div>

                {/* Bottom Section: Actions & Price */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-2">
                    {/* Action button based on status */}
                    {isExpired ? (
                      <button 
                        onClick={() => handleRenew(sub)}
                        className="bg-primary text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-[#5D1026] transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        إعادة تفعيل
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRenew(sub)}
                        className="bg-secondary text-white px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-[#a68648] transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        تجديد
                      </button>
                    )}
                    <button 
                      onClick={() => openEdit(sub)}
                      className="bg-[#F5F5F7] text-gray-500 p-2.5 rounded-2xl hover:bg-gray-200 transition-colors"
                      title="تعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handlePrintReceipt(sub)}
                      disabled={printingId === sub.id}
                      className="bg-[#F5F5F7] text-gray-500 p-2.5 rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                      title="طباعة إيصال"
                    >
                      {printingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    </button>
                    <button 
                      onClick={() => handleDeleteSub(sub)}
                      className="bg-red-50 text-red-500 p-2.5 rounded-2xl hover:bg-red-100 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-left flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-bold mb-0.5">رسوم الاشتراك</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-primary">{sub.monthlyFee || 0}</span>
                      <span className="text-[10px] text-gray-500 font-bold">ريال</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Renew Modal (Kept clean and functional) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-primary">
                تعديل / تجديد اشتراك
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            
            <div className="p-6">
              <div className="bg-[#F5F5F7] rounded-[16px] p-4 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm">
                  {editingSub?.Member?.fullNameArabic?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-extrabold text-primary">{editingSub?.Member?.fullNameArabic}</p>
                  <p className="text-xs font-bold text-secondary mt-0.5">{editingSub?.Sport?.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Coach Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">المدرب</label>
                  <select
                    value={form.coachId}
                    onChange={e => setForm({...form, coachId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 font-medium bg-[#F9F9FB]"
                  >
                    <option value="">-- اختر المدرب (اختياري) --</option>
                    {coaches
                      .filter(c => !c.sportId || c.sportId === editingSub?.Sport?.id)
                      .map(coach => (
                        <option key={coach.id} value={coach.id}>
                          {coach.fullName}{coach.CoachsalaryPercentage ? ` — ${coach.CoachsalaryPercentage}%` : ""}
                        </option>
                      ))
                    }
                  </select>
                  {form.coachId && (() => {
                    const coach = coaches.find(c => c.id === form.coachId);
                    const pct = coach?.CoachsalaryPercentage;
                    const share = pct && form.monthlyFee ? Math.round((Number(form.monthlyFee) * pct) / 100) : null;
                    return coach ? (
                      <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700 font-medium flex gap-4">
                        <span>📊 {coach.fullName}</span>
                        {pct && <span>النسبة: <strong>{pct}%</strong></span>}
                        {share !== null && <span>الحصة: <strong>{share} ر.ق</strong></span>}
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">بداية الاشتراك</label>
                    <input type="date" value={form.subscriptionStart} onChange={e => setForm({...form, subscriptionStart: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 font-medium bg-[#F9F9FB]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-500 mb-1.5 uppercase">نهاية الاشتراك</label>
                    <input type="date" value={form.subscriptionEnd} onChange={e => setForm({...form, subscriptionEnd: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 font-medium bg-[#F9F9FB]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">رسوم الاشتراك (ريال)</label>
                    <input type="number" value={form.monthlyFee} onChange={e => setForm({...form, monthlyFee: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 font-medium bg-[#F9F9FB]" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">الحالة</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 font-bold bg-[#F9F9FB]">
                      <option value="active">مفعل</option>
                      <option value="expired">منتهي</option>
                      <option value="frozen">مجمد</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-white border border-gray-200 rounded-[14px] text-gray-700 hover:bg-gray-50 transition-all font-bold text-sm">إلغاء</button>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="px-8 py-3 bg-primary text-white rounded-[14px] transition-all duration-200 hover:bg-[#5D1026] hover:shadow-lg disabled:opacity-50 font-bold text-sm flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
