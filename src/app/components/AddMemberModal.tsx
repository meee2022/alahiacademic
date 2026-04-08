import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { insforge } from "@/lib/insforge/client";
import { useRouter } from "next/navigation";

export default function AddMemberModal({
  isOpen,
  onClose,
  onSuccess,
  sports
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sports: any[];
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullNameArabic: "",
    fullNameEnglish: "",
    phoneFather: "",
    phoneMother: "",
    notes: "",
    sportId: "",
    subscriptionStart: new Date().toISOString().split("T")[0],
    subscriptionEnd: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split("T")[0];
    })(),
    paidAmount: "",
    paymentMethod: "cash",
    dateOfBirth: "",
    nationalId: ""
  });

  const router = useRouter();

  if (!isOpen) return null;

  async function handleSave() {
    if (!form.fullNameArabic.trim()) {
      alert("الاسم بالكامل (عربي) مطلوب");
      return;
    }
    setSaving(true);
    try {
      const { data, error: memberErr } = await insforge.database.from("Member").insert({
        fullNameArabic: form.fullNameArabic,
        fullNameEnglish: form.fullNameEnglish || null,
        phoneFather: form.phoneFather || null,
        phoneMother: form.phoneMother || null,
        notes: form.notes || null,
        isSchoolProgram: false,
        isClubSon: false,
        dateOfBirth: form.dateOfBirth || null,
        nationalId: form.nationalId || null
      }).select();

      if (memberErr) throw memberErr;
      
      const memberData = data && data.length > 0 ? data[0] : null;
      if (!memberData) throw new Error("تعذر جلب بيانات العضو المضاف حديثاً (ربما بسبب صلاحيات RLS).");

      if (form.sportId) {
        const { error: enrollErr } = await insforge.database.from("SportsEnrollment").insert({
          memberId: memberData.id,
          sportId: form.sportId,
          subscriptionStart: form.subscriptionStart,
          subscriptionEnd: form.subscriptionEnd,
          monthlyFee: 0,
          status: "active"
        });
        if (enrollErr) throw enrollErr;

        if (Number(form.paidAmount) > 0) {
          const { data: payData, error: payErr } = await insforge.database.from("Payment").insert({
            memberId: memberData.id,
            sportId: form.sportId,
            date: new Date().toISOString().split('T')[0],
            endOfSubscriptionDate: form.subscriptionEnd,
            paymentType: "subscription",
            category: "income",
            method: form.paymentMethod as any,
            amount: Number(form.paidAmount),
            description: "اشتراك جديد"
          }).select().single();
          
          if (payErr) throw payErr;
          
          if (payData) {
            onSuccess();
            onClose();
            router.push(`/receipt/${payData.id}`);
            setSaving(false);
            return;
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("تفاصيل الخطأ: " + JSON.stringify(err, null, 2));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header - always visible */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">إضافة عضو جديد</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f8f5f0] rounded-xl transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Scrollable content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 modal-content-safe">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم بالكامل (عربي) *</label>
            <input 
              type="text" 
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900"
              value={form.fullNameArabic}
              onChange={e => setForm({...form, fullNameArabic: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم بالكامل (إنجليزي)</label>
            <input 
              type="text" 
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900 text-left dir-ltr"
              value={form.fullNameEnglish}
              onChange={e => setForm({...form, fullNameEnglish: e.target.value})}
              placeholder="Full Name in English"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">تاريخ الميلاد</label>
              <input 
                type="date" 
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900"
                value={form.dateOfBirth}
                onChange={e => setForm({...form, dateOfBirth: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">الرقم الشخصي (ID)</label>
              <input 
                type="text" 
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900 text-left dir-ltr"
                value={form.nationalId}
                onChange={e => setForm({...form, nationalId: e.target.value})}
                placeholder="مثال: 29012345678"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">هاتف الأب</label>
              <input 
                type="tel" 
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900 text-left dir-ltr"
                value={form.phoneFather}
                onChange={e => setForm({...form, phoneFather: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">هاتف الأم</label>
              <input 
                type="tel" 
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900 text-left dir-ltr"
                value={form.phoneMother}
                onChange={e => setForm({...form, phoneMother: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">الرياضة الأساسية (اختياري)</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900 bg-white"
              value={form.sportId}
              onChange={e => setForm({...form, sportId: e.target.value})}
            >
              <option value="">-- بدون رياضة حالياً --</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {form.sportId && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">تاريخ البداية</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900"
                    value={form.subscriptionStart}
                    onChange={e => setForm({...form, subscriptionStart: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">تاريخ النهاية</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900"
                    value={form.subscriptionEnd}
                    onChange={e => setForm({...form, subscriptionEnd: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fdfaf6] p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">المبلغ المدفوع (ريال)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900"
                    placeholder="مثال: 150"
                    value={form.paidAmount}
                    onChange={e => setForm({...form, paidAmount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">طريقة الدفع</label>
                  <select 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900 bg-white"
                    value={form.paymentMethod}
                    onChange={e => setForm({...form, paymentMethod: e.target.value})}
                  >
                    <option value="cash">نقدي (Cash)</option>
                    <option value="cardMachine">جهاز البطاقة (Card)</option>
                    <option value="transferATM">تحويل (Transfer)</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ملاحظات</label>
            <textarea 
              rows={2} 
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-[#7a1b32] focus:border-[#7a1b32] text-gray-900"
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>
        </div>
        
        {/* Footer - always visible */}
        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end bg-[#fdfaf6]/50 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-white transition-all font-medium bg-white order-2 sm:order-1">
            إلغاء
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2.5 text-white rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 font-medium flex items-center justify-center gap-2 order-1 sm:order-2"
            style={{background: "linear-gradient(135deg, #7a1b32, #c0392b)"}}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            حفظ وإضافة
          </button>
        </div>
      </div>
    </div>
  );
}
