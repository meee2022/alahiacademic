"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Printer, Download, Loader2, X, Wallet, Edit, Trash2, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Menu } from "lucide-react";
import { getPayments, PaymentWithMember, getSports } from "@/lib/insforge/queries";
import { insforge } from "@/lib/insforge/client";

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payments, setPayments] = useState<PaymentWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("income");
  const [sports, setSports] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    method: "cash",
    paymentType: "subscription",
    sportId: "",
    memberId: "",
    notes: ""
  });

  useEffect(() => {
    fetchPayments();
    fetchSportsAndMembers();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getPayments(500);
      setPayments(data);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const fetchSportsAndMembers = async () => {
    const sportsData = await getSports();
    setSports(sportsData as any[]);
    const { data: membersData } = await insforge.database.from("Member").select("id, fullNameArabic").order("fullNameArabic");
    setMembers(membersData || []);
  };

  const openModal = (type: "income" | "expense") => {
    setModalType(type);
    setFormData({
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      method: "cash",
      paymentType: type === "income" ? "subscription" : "other",
      sportId: "",
      memberId: "",
      notes: ""
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.date) {
      alert("يرجى إدخال المبلغ والتاريخ");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        amount: Number(formData.amount),
        description: formData.description || (modalType === "expense" ? "مصروف" : "إيراد"),
        date: formData.date,
        method: formData.method as any,
        paymentType: formData.paymentType as any,
        category: modalType,
        sportId: formData.sportId || null,
        memberId: formData.memberId || null,
        notes: formData.notes || null
      };

      if (editingId) {
        const { error: updateError } = await insforge.database.from("Payment").update(payload).eq("id", editingId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await insforge.database.from("Payment").insert(payload);
        if (insertError) throw insertError;
      }
      setShowModal(false);
      setEditingId(null);
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (payment: PaymentWithMember) => {
    setEditingId(payment.id);
    setModalType(payment.category as "income" | "expense");
    setFormData({
      amount: payment.amount.toString(),
      description: payment.description || "",
      date: payment.date,
      method: payment.method,
      paymentType: payment.paymentType,
      sportId: payment.sportId || "",
      memberId: payment.memberId || "",
      notes: payment.notes || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    try {
      const { error } = await insforge.database.from("Payment").delete().eq("id", id);
      if (error) throw error;
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.description?.includes(searchTerm) ||
      p.Member?.fullNameArabic?.includes(searchTerm) ||
      p.notes?.includes(searchTerm);
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;

    let matchesDate = true;
    if (startDate && endDate) {
      matchesDate = p.date >= startDate && p.date <= endDate;
    } else if (startDate) {
      matchesDate = p.date >= startDate;
    } else if (endDate) {
      matchesDate = p.date <= endDate;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const totals = filteredPayments.reduce((acc, p) => {
    const amt = Number(p.amount);
    if (p.category === "income") {
      acc.income += amt;
      if (p.method === "cash") acc.cash += amt;
      if (p.method === "transferATM" || p.method === "bankDeposit") acc.transfers += amt;
      if (p.paymentType === "belt") acc.belts += amt;
    } else {
      acc.expenses += amt;
    }
    return acc;
  }, { cash: 0, transfers: 0, belts: 0, expenses: 0, income: 0 });

  const handleExportCSV = () => {
    const headers = ["التاريخ", "الوصف", "العضو", "التصنيف", "المبلغ", "طريقة الدفع", "النوع", "ملاحظات"];
    const rows = filteredPayments.map(p => [
      p.date,
      `"${p.description || "مصروف"}"`,
      `"${p.Member?.fullNameArabic || "---"}"`,
      p.category === "income" ? "إيراد" : "مصروف",
      p.amount,
      p.method === "transferATM" ? "تحويل" : p.method === "cardMachine" ? "بطاقة" : "كاش",
      p.paymentType === "subscription" ? "اشتراك" : p.paymentType === "belt" ? "اختبار حزام" : "أخرى",
      `"${p.notes || "---"}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `مدفوعات_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6 pt-4 font-sans bg-[#FAFAFA] min-h-screen -mt-4 p-4 print:bg-white print:p-0 print:m-0 print:min-h-0 print:pb-0" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>

      {/* Print-Only Custom Header */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-gray-100 pb-6">
        <h1 className="text-2xl font-black text-[#5A0B1A] mb-2">تقرير مالية الأكاديمية</h1>
        <p className="text-gray-500 font-bold text-sm">
          {startDate && endDate ? `الفترة: من ${startDate} إلى ${endDate}` :
            startDate ? `من تاريخ: ${startDate}` :
              endDate ? `حتى تاريخ: ${endDate}` :
                'التقرير المالي الشامل'}
        </p>
        <p className="text-xs text-gray-400 mt-2">تاريخ الطباعة: {new Date().toLocaleDateString('ar-QA')}</p>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Menu className="w-6 h-6 text-gray-800 cursor-pointer" />
          <h1 className="text-2xl font-black text-[#5A0B1A]">نظرة عامة على الحسابات</h1>
        </div>
        <button onClick={() => window.print()} className="w-10 h-10 rounded-full bg-[#fcecc2] flex items-center justify-center text-[#a0743b] font-bold shadow-sm hover:bg-[#a0743b] hover:text-white transition-colors">
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* REVENUE */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between border-r-[4px] border-[#a0743b] h-48 print:shadow-none print:border print:border-gray-200">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-50 rounded-full opacity-50"></div>
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#8A1538]" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-[#8A1538] uppercase mt-2">الإيرادات</span>
            </div>
            <div className="text-gray-500 text-sm font-medium mb-1 relative z-10">إجمالي الإيرادات</div>
            <div className="flex items-baseline gap-1.5 mb-3 relative z-10">
              <span className="text-4xl font-black text-gray-900">{totals.income.toLocaleString()}</span>
              <span className="text-xs font-bold text-[#8A1538]">ر.ق</span>
            </div>
          </div>

          <div className="flex gap-2 relative z-10 flex-wrap">
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full">كاش: {totals.cash}</span>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full">تحويل: {totals.transfers}</span>
          </div>
        </div>

        {/* EXPENSES */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between border-r-[4px] border-gray-100 h-48 print:shadow-none print:border print:border-gray-200">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F8F9FB] rounded-full opacity-80"></div>
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#F8F9FB] flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-2">المصروفات</span>
            </div>
            <div className="text-gray-500 text-sm font-medium mb-1 relative z-10">إجمالي المصروفات</div>
            <div className="flex items-baseline gap-1.5 mb-3 relative z-10">
              <span className="text-4xl font-black text-gray-900">{totals.expenses.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-400">ر.ق</span>
            </div>
          </div>
          <div className="flex gap-2 relative z-10">
            <span className="bg-rose-50 text-rose-500 text-[10px] font-bold px-2.5 py-1 rounded-full">إدارة وتأسيس</span>
            <span className="text-gray-400 text-[10px] font-medium py-1">النسبة الأكبر</span>
          </div>
        </div>

        {/* NET PROFIT */}
        <div className="bg-[#5A0B1A] rounded-3xl p-6 shadow-xl shadow-[#5A0B1A]/20 relative overflow-hidden flex flex-col justify-between text-white h-48 print:shadow-none">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute top-0 bottom-0 left-0 w-1/4 bg-white/5 blur-2xl skew-x-12"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#8A1538] rounded-full"></div>
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
                <Wallet className="w-5 h-5 text-[#c19951]" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-[#c19951] uppercase mt-2">صافي الربح</span>
            </div>
            <div className="text-white/80 text-sm font-medium mb-1 relative z-10">الربح التقديري</div>
            <div className="flex items-baseline gap-1.5 mb-3 relative z-10">
              <span className="text-4xl font-black text-white">{(totals.income - totals.expenses).toLocaleString()}</span>
              <span className="text-xs font-bold text-[#c19951]">ر.ق</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto relative z-10">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 rounded-full bg-[#c19951]/90"></div>
              <div className="w-4 h-4 rounded-full bg-[#a0743b]/80 border border-[#5A0B1A]"></div>
            </div>
            <span className="text-[10px] text-white/60">يُحسب يومياً</span>
          </div>
        </div>

      </div>

      {/* Search & Actions */}
      <div className="space-y-4 pt-2 print:hidden px-2">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في المعاملات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-gray-100 rounded-2xl py-3.5 pr-12 pl-4 text-sm focus:ring-2 focus:ring-[#8A1538]/20 outline-none placeholder:text-gray-400 font-medium"
            />
          </div>
          <div className="flex items-center bg-[#F5F5F7] border border-gray-100 rounded-2xl px-3 py-2 gap-2 overflow-x-auto">
            <span className="text-gray-400 text-[10px] font-bold whitespace-nowrap">من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] font-bold text-[#8A1538] cursor-pointer"
            />
            <span className="text-gray-400 text-[10px] font-bold whitespace-nowrap">إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] font-bold text-[#8A1538] cursor-pointer"
            />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(""); setEndDate(""); }} className="mr-1 text-gray-400 hover:text-rose-500 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <button onClick={() => openModal("income")} className="flex-1 min-w-[140px] bg-[#5A0B1A] hover:bg-[#3d0611] text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-md shadow-[#5A0B1A]/20">
            <Plus className="w-4 h-4" /> إضافة إيراد
          </button>
          <button onClick={() => openModal("expense")} className="flex-1 min-w-[140px] bg-white border border-gray-100 text-[#5A0B1A] hover:bg-rose-50 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-sm">
            <span className="text-lg leading-none mb-0.5">-</span> إضافة مصروف
          </button>
          <button onClick={handleExportCSV} className="w-[52px] bg-white border border-gray-100 text-gray-500 hover:bg-gray-50 rounded-2xl flex items-center justify-center transition-colors shadow-sm shrink-0">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] min-h-[400px] print:shadow-none print:p-0 print:min-h-0 print:border-t print:border-gray-100 print:rounded-none">
        <div className="flex justify-between items-center mb-6 print:mb-4">
          <h2 className="text-lg font-extrabold text-gray-900">سجل المعاملات</h2>
          <button className="text-[10px] font-bold tracking-[0.15em] text-[#a0743b] uppercase print:hidden">عرض الكل</button>
        </div>

        <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4 px-2 border-b border-gray-100 pb-3 print:border-gray-300">
          <span>تفاصيل المعاملة</span>
          <span>المبلغ والتاريخ</span>
        </div>

        <div className="space-y-2 print:space-y-0">
          {filteredPayments.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm">لا توجد معاملات</div>
          ) : (
            filteredPayments.map((payment, idx) => {
              const isIncome = payment.category === "income";
              const d = new Date(payment.date);
              const day = d.getDate().toString().padStart(2, '0');
              const month = d.toLocaleDateString('ar-QA', { month: 'short' });
              const year = d.getFullYear();

              return (
                <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-[#F9F9FB] rounded-2xl transition-colors cursor-pointer group border border-transparent hover:border-gray-100 print:p-3 print:border-b print:border-gray-100 print:rounded-none print:break-inside-avoid" onClick={() => openEdit(payment)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isIncome ? 'bg-[#EAFBF3] text-emerald-600' : 'bg-[#FEEBEB] text-rose-600'}`}>
                      {isIncome ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 text-sm mb-1">{payment.description || (isIncome ? "إيراد عام" : "مصروف عام")}</div>
                      <div className="text-[11px] text-gray-500 font-medium">{payment.Member?.fullNameArabic ? `العضو: ${payment.Member.fullNameArabic}` : "أخرى"}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`font-black text-sm pr-1 ${isIncome ? 'text-emerald-600' : 'text-gray-900'}`} dir="ltr">
                      {isIncome ? '+' : '-'}{payment.amount} <span className="text-[10px] text-gray-400 font-bold ml-0.5">ر.ق</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100/50">
                      {day} {month} {year}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "تعديل السجل" : modalType === "income" ? "إضافة إيراد جديد" : "إضافة مصروف جديد"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#f8f5f0] rounded-xl transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المبلغ *</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">التاريخ *</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">الوصف</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900" placeholder="وصف العملية..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">طريقة الدفع</label>
                  <select value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900">
                    <option value="cash">كاش</option>
                    <option value="transferATM">تحويل / ATM</option>
                    <option value="cardMachine">بطاقة</option>
                    <option value="bankDeposit">إيداع بنكي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">النوع</label>
                  <select value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900">
                    <option value="subscription">اشتراك</option>
                    <option value="belt">اختبار حزام</option>
                    <option value="uniform">ملابس</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              {modalType === "income" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">العضو (اختياري)</label>
                    <select value={formData.memberId} onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900">
                      <option value="">اختر عضو</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.fullNameArabic}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">الرياضة (اختياري)</label>
                    <select value={formData.sportId} onChange={e => setFormData({ ...formData, sportId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900">
                      <option value="">اختر رياضة</option>
                      {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ملاحظات</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900" placeholder="أي ملاحظات إضافية..." />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-[#fdfaf6] transition-all font-medium">إلغاء</button>
              <button onClick={handleSubmit} disabled={saving}
                className="px-6 py-2.5 text-white rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 font-medium flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #7a1b32, #c0392b)" }}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
