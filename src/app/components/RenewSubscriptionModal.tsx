"use client";

import { useState } from "react";
import { RefreshCcw, X, Loader2 } from "lucide-react";
import { renewSubscription } from "@/lib/insforge/queries";
import { useRouter } from "next/navigation";

export function RenewSubscriptionModal({ memberId, enrollments }: { memberId: string, enrollments: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const activeEnrollments = enrollments.filter((e) => e.status === 'active' || e.status === 'expired');

  const [formData, setFormData] = useState({
    enrollmentId: activeEnrollments[0]?.id || "",
    months: 1,
    amount: activeEnrollments[0]?.monthlyFee || 0,
    paymentMethod: "cash",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enrollmentId) return;

    setLoading(true);
    try {
      const selectedEnrollment = enrollments.find(e => e.id === formData.enrollmentId);
      
      // Calculate new end date (approximate: add specified months)
      const currentEnd = new Date(selectedEnrollment.subscriptionEnd);
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + Number(formData.months));

      const result = await renewSubscription(
        formData.enrollmentId,
        newEnd.toISOString().split('T')[0],
        Number(formData.amount) / Number(formData.months), // update monthly fee if needed
        {
          memberId,
          sportId: selectedEnrollment.sportId,
          amount: Number(formData.amount),
          date: new Date().toISOString().split('T')[0],
          method: formData.paymentMethod as "cash" | "transferATM" | "cardMachine" | "bankDeposit",
          category: 'income',
          description: `تجديد اشتراك ${formData.months} شهر`
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
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الرياضة</label>
                <select 
                  value={formData.enrollmentId}
                  onChange={(e) => {
                    const en = enrollments.find(x => x.id === e.target.value);
                    setFormData({...formData, enrollmentId: e.target.value, amount: en?.monthlyFee || 0});
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  {activeEnrollments.map(en => (
                    <option key={en.id} value={en.id}>{en.Sport?.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">عدد الأشهر</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.months}
                    onChange={(e) => setFormData({...formData, months: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
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
                </select>
              </div>

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
