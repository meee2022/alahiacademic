"use client";

import { useState } from "react";
import { Edit2, X, Loader2 } from "lucide-react";
import { updateMember } from "@/lib/insforge/queries";
import { useRouter } from "next/navigation";

export function EditMemberModal({ member }: { member: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullNameArabic: member.fullNameArabic || "",
    fullNameEnglish: member.fullNameEnglish || "",
    phoneFather: member.phoneFather || "",
    phoneMother: member.phoneMother || "",
    notes: member.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMember(member.id, formData);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-[#fdfaf6] transition-colors font-semibold"
      >
        <Edit2 className="h-4 w-4" />
        تعديل البيانات
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#fdfaf6] shrink-0">
              <h3 className="text-xl font-bold text-gray-900">تعديل بيانات العضو</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 modal-content-safe">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الاسم بالعربية</label>
                <input 
                  type="text" 
                  value={formData.fullNameArabic}
                  onChange={(e) => setFormData({...formData, fullNameArabic: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الاسم بالإنجليزية</label>
                <input 
                  type="text" 
                  value={formData.fullNameEnglish}
                  onChange={(e) => setFormData({...formData, fullNameEnglish: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">هاتف الأب</label>
                  <input 
                    type="tel" 
                    value={formData.phoneFather}
                    onChange={(e) => setFormData({...formData, phoneFather: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">هاتف الأم</label>
                  <input 
                    type="tel" 
                    value={formData.phoneMother}
                    onChange={(e) => setFormData({...formData, phoneMother: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-[#5c1425] transition-colors flex justify-center items-center order-1 sm:order-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "حفظ التعديلات"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-[#f8f5f0] text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors order-2 sm:order-1"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
