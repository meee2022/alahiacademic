"use client";

import { useState, useEffect } from "react";
import { RefreshCcw, X, Loader2 } from "lucide-react";
import { renewSubscription } from "@/lib/insforge/queries";
import { insforge } from "@/lib/insforge/client";
import { useRouter } from "next/navigation";

export function RenewSubscriptionModal({ memberId, enrollments }: { memberId: string, enrollments: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coaches, setCoaches] = useState<any[]>([]);
  const router = useRouter();

  const activeEnrollments = enrollments.filter((e) => e.status === 'active' || e.status === 'expired');

  const calculateEndDate = (enrollment: any, months: number) => {
    if (!enrollment || !enrollment.subscriptionEnd) return new Date().toISOString().split('T')[0];
    const currentEnd = new Date(enrollment.subscriptionEnd);
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + Number(months));
    return newEnd.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    enrollmentId: activeEnrollments[0]?.id || "",
    months: 1,
    amount: activeEnrollments[0]?.monthlyFee || 0,
    paymentMethod: "cash",
    endDate: activeEnrollments[0] ? calculateEndDate(activeEnrollments[0], 1) : "",
    coachId: "",
  });

  // Fetch all coaches when modal opens
  useEffect(() => {
    if (!isOpen) return;
    async function fetchCoaches() {
      const { data } = await insforge.database
        .from("Coach")
        .select("id, fullName, sportId, CoachsalaryPercentage")
        .order("fullName");
      setCoaches(data || []);
    }
    fetchCoaches();
  }, [isOpen]);

  // When enrollmentId changes, auto-reset coach selection
  const selectedEnrollment = enrollments.find(e => e.id === formData.enrollmentId);
  const filteredCoaches = coaches.filter(c => !c.sportId || c.sportId === selectedEnrollment?.sportId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enrollmentId) return;

    setLoading(true);
    try {
      const selectedCoach = coaches.find(c => c.id === formData.coachId);
      const coachNote = selectedCoach ? `المدرب: ${selectedCoach.fullName}` : "";

      const result = await renewSubscription(
        formData.enrollmentId,
        formData.endDate,
        Number(formData.amount) / Number(formData.months),
        {
          memberId,
          sportId: selectedEnrollment.sportId,
          amount: Number(formData.amount),
          date: new Date().toISOString().split('T')[0],
          method: formData.paymentMethod as "cash" | "transferATM" | "cardMachine" | "bankDeposit",
          category: 'income',
          description: `تجديد اشتراك ${formData.months} شهر`,
          notes: coachNote || null,
        }
      );
      
      setIsOpen(false);
      router.refresh();
      if (result.paymentId) {
        router.push(`/receipt/${result.paymentId}`);
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تجديد الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  if (activeEnrollments.length === 0) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-semibold"
      >
        <RefreshCcw className="h-4 w-4" />
        تجديد اشتراك
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#fdfaf6] shrink-0">
              <h3 className="text-xl font-bold text-gray-900">تجديد الاشتراك</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 modal-content-safe">
              {/* Sport Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الرياضة</label>
                <select 
                  value={formData.enrollmentId}
                  onChange={(e) => {
                    const en = enrollments.find(x => x.id === e.target.value);
                    setFormData({...formData, enrollmentId: e.target.value, amount: en?.monthlyFee || 0, endDate: calculateEndDate(en, formData.months), coachId: ""});
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  {activeEnrollments.map(en => (
                    <option key={en.id} value={en.id}>{en.Sport?.name}</option>
                  ))}
                </select>
              </div>

              {/* Coach Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المدرب
                  {filteredCoaches.length === 0 && coaches.length > 0 && (
                    <span className="text-xs text-gray-400 font-normal mr-2">(لا يوجد مدربون لهذه الرياضة)</span>
                  )}
                </label>
                <select
                  value={formData.coachId}
                  onChange={(e) => setFormData({...formData, coachId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                >
                  <option value="">-- اختر المدرب (اختياري) --</option>
                  {filteredCoaches.map(coach => (
                    <option key={coach.id} value={coach.id}>
                      {coach.fullName}
                      {coach.CoachsalaryPercentage ? ` — ${coach.CoachsalaryPercentage}%` : ""}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Dates row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">عدد الأشهر</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.months}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      const en = enrollments.find(x => x.id === formData.enrollmentId);
                      setFormData({...formData, months: m, endDate: calculateEndDate(en, m)});
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الانتهاء</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
              </div>

              {/* Amount & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ المدفوع (ر.ق)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">طريقة الدفع</label>
                  <select 
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="cash">نقدي (Cash)</option>
                    <option value="cardMachine">جهاز البطاقة (Card)</option>
                    <option value="transferATM">تحويل (Transfer)</option>
                    <option value="bankDeposit">إيداع بنكي</option>
                  </select>
                </div>
              </div>

              {/* Coach info badge if selected */}
              {formData.coachId && (() => {
                const coach = coaches.find(c => c.id === formData.coachId);
                if (!coach) return null;
                const percentage = coach.CoachsalaryPercentage;
                const coachShare = percentage ? Math.round((Number(formData.amount) * percentage) / 100) : null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                    <div className="font-bold text-amber-800 mb-1">📊 ملخص المدرب</div>
                    <div className="text-amber-700">المدرب: <strong>{coach.fullName}</strong></div>
                    {percentage && <div className="text-amber-700">النسبة: <strong>{percentage}%</strong></div>}
                    {coachShare !== null && (
                      <div className="text-amber-700">حصة المدرب: <strong>{coachShare} ر.ق</strong></div>
                    )}
                  </div>
                );
              })()}

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex justify-center items-center"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "تأكيد التجديد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
