"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge/client";
import { Loader2, Printer, ArrowRight } from "lucide-react";

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReceiptData() {
      if (!params.id) return;
      
      const { data, error } = await insforge.database.from("Payment")
        .select(`
          *,
          Member:memberId (fullNameArabic, phoneFather),
          Sport:sportId (name)
        `)
        .eq("id", params.id)
        .single();
        
      if (error) {
        console.error(error);
      } else {
        setPayment(data);
      }
      setLoading(false);
    }
    
    fetchReceiptData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex text-center items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#7a1b32]" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">لم يتم العثور على الإيصال</h2>
        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 font-bold">العودة</button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .min-h-screen { min-height: auto !important; padding: 0 !important; }
          .max-w-2xl { max-width: 100% !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
          
          /* Scale down to fit on one page */
          .p-10 { padding: 20px !important; }
          .pb-8 { padding-bottom: 16px !important; }
          .mb-8 { margin-bottom: 16px !important; }
          .mb-12 { margin-bottom: 24px !important; }
          .pt-8 { padding-top: 16px !important; }
          .gap-8 { gap: 16px !important; }
          
          h1.text-3xl { font-size: 24px !important; }
          p.text-xl { font-size: 16px !important; }
          td { padding-top: 12px !important; padding-bottom: 12px !important; font-size: 14px !important; }
          th { padding-top: 8px !important; padding-bottom: 8px !important; font-size: 12px !important; }
          .text-3xl { font-size: 24px !important; }
        }
      `}</style>
      <div className="min-h-screen bg-[#f8f5f0] p-8 flex flex-col items-center">
      {/* Print Controls - Hidden during printing */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-8 print:hidden">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-xl font-bold hover:bg-[#fdfaf6] shadow-sm border border-gray-200 transition-all"
        >
          <ArrowRight className="h-5 w-5" />
          رجوع
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all"
          style={{background: "linear-gradient(135deg, #7a1b32, #c0392b)"}}
        >
          <Printer className="h-5 w-5" />
          طباعة الإيصال
        </button>
      </div>

      {/* Printable Receipt Paper */}
      <div className="w-full max-w-2xl bg-white rounded-none md:rounded-2xl shadow-xl print:shadow-none p-10 print:p-0">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b-2 border-gray-100 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2" style={{color: "#7a1b32"}}>أكاديمية الأبطال</h1>
            <p className="text-gray-500 font-semibold text-sm">إيصال استلام نقدية / Payment Receipt</p>
          </div>
          <div className="text-left font-mono text-gray-400">
            <p>رقم الإيصال: {payment.id?.split("-")[0].toUpperCase()}</p>
            <p>التاريخ: {new Date(payment.date).toLocaleDateString("ar-EG")}</p>
          </div>
        </div>

        {/* Member & Context Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">استلمنا من السيد / Member</p>
            <p className="text-xl font-bold text-gray-900">{payment.Member?.fullNameArabic || "غير مسجل"}</p>
            {payment.Member?.phoneFather && <p className="text-sm text-gray-500 font-mono mt-1">{payment.Member.phoneFather}</p>}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">نوع الرياضة / Sport</p>
            <p className="text-xl font-bold text-gray-900">{payment.Sport?.name || "عام"}</p>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
          <table className="w-full text-right">
            <thead className="bg-[#fdfaf6] border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">البيان</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">صلاحية الاشتراك</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 w-32 text-left">المبلغ التدريبي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-white">
                <td className="px-6 py-5 text-gray-900 font-bold">
                  {payment.paymentType === "subscription" ? "اشتراك تدريب" : 
                   payment.paymentType === "belt" ? "اختبار حزام" : 
                   payment.paymentType === "uniform" ? "زي رياضي" : "أخرى"}
                </td>
                <td className="px-6 py-5 text-gray-600">
                  {payment.endOfSubscriptionDate ? `حتى ${new Date(payment.endOfSubscriptionDate).toLocaleDateString("ar-EG")}` : "---"}
                </td>
                <td className="px-6 py-5 text-gray-900 font-black text-left font-mono text-lg">
                  {payment.amount.toLocaleString()} ريال
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-12">
          <div className="w-full max-w-sm rounded-xl bg-[#fdfaf6] p-6 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-bold">الإجمالي الكلي</span>
              <span className="text-3xl font-black text-gray-900" style={{color: "#7a1b32"}}>
                {payment.amount.toLocaleString()} <span className="text-lg">ريال</span>
              </span>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <span className="text-gray-500 font-bold text-sm">وسيلة الدفع</span>
              <span className="text-gray-800 font-bold">
                {payment.method === "cash" ? "كاش" :
                 payment.method === "transferATM" ? "تحويل بنكي" :
                 payment.method === "cardMachine" ? "شبكة / صراف" : "إيداع"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-dashed border-gray-200 pt-8 mt-auto flex justify-between items-end text-sm text-gray-400 font-semibold">
          <div>
            <p className="mb-1">توقيع المستلم / Receiver Signature</p>
            <p className="text-gray-300">___________________________</p>
          </div>
          <div className="text-left font-mono">
            <p>تم الإصدار بواسطة نظام الإدارة</p>
            <p>{new Date().toLocaleString("ar-EG")}</p>
          </div>
        </div>
        
      </div>
    </div>
    </>
  );
}
