"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { insforge } from "@/lib/insforge/client";

export function LeadForm({ sports }: { sports: any[] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sportInterest, setSportInterest] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await insforge.database.from("Lead").insert([
        {
          name,
          phone,
          sportInterest,
        },
      ]);

      if (error) throw error;
      
      setSuccess(true);
      setName("");
      setPhone("");
      setSportInterest("");
    } catch (err) {
      console.error("Error submitting lead:", err);
      alert("حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-fade-in">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">شكراً لاهتمامك!</h3>
        <p className="text-gray-600">لقد تم استلام طلبك بنجاح. سنتواصل معك في أقرب وقت ممكن.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-6 text-primary font-bold hover:underline"
        >
          إرسال طلب آخر
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">الاسم الكريم</label>
          <input 
            type="text" 
            id="name" 
            required
            className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-[#fdfaf6] hover:bg-white" 
            placeholder="اسمك الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
          <input 
            type="tel" 
            id="phone" 
            required
            className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-[#fdfaf6] hover:bg-white" 
            placeholder="050xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label htmlFor="interest" className="block text-sm font-bold text-gray-700 mb-2">الرياضة المهتم بها</label>
        <select 
          id="interest" 
          required
          className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-[#fdfaf6] hover:bg-white text-gray-700"
          value={sportInterest}
          onChange={(e) => setSportInterest(e.target.value)}
        >
          <option value="">اختر رياضة</option>
          {sports.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-primary hover:bg-[#5c1425] text-white font-extrabold py-5 px-6 rounded-xl transition-all shadow-lg hover:shadow-red-900/40 flex items-center justify-center gap-3 disabled:opacity-70 group"
      >
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        {loading ? "جاري الإرسال..." : "إرسال طلب الاستفسار"}
        {!loading && <CheckCircle2 className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </button>
    </form>
  );
}
