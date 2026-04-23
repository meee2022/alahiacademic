"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge/client";
import { Loader2, Printer, ArrowRight } from "lucide-react";

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<any>(null);
  const [lang, setLang] = useState<"ar" | "en">("ar");
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
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f2f5"}}>
        <Loader2 className="h-10 w-10 animate-spin" style={{color:"#7a1b32"}} />
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",background:"#f0f2f5"}}>
        <h2 style={{fontSize:"1.5rem",fontWeight:800,color:"#333"}}>لم يتم العثور على الإيصال</h2>
        <button onClick={() => router.back()} style={{padding:"10px 24px",background:"#ddd",borderRadius:"12px",border:"none",fontWeight:700,cursor:"pointer"}}>العودة</button>
      </div>
    );
  }

  const isEn = lang === "en";
  const receiptNumber = payment.id?.split("-")[0].toUpperCase();
  const dateFormatted = new Date(payment.date || new Date()).toLocaleDateString(isEn ? "en-US" : "ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const endDateFormatted = payment.endOfSubscriptionDate
    ? new Date(payment.endOfSubscriptionDate).toLocaleDateString(isEn ? "en-US" : "ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const paymentTypeLabel =
    payment.paymentType === "subscription" ? (isEn ? "Training Subscription" : "اشتراك تدريب") :
    payment.paymentType === "belt" ? (isEn ? "Belt Test" : "اختبار حزام") :
    payment.paymentType === "uniform" ? (isEn ? "Uniform" : "زي رياضي") :
    payment.paymentType === "registration" ? (isEn ? "Registration Fee" : "رسوم تسجيل") : (isEn ? "Other" : "أخرى");

  const methodLabel =
    payment.method === "cash" ? (isEn ? "Cash" : "نقدي (كاش)") :
    payment.method === "transferATM" ? (isEn ? "Bank Transfer" : "تحويل بنكي") :
    payment.method === "bankDeposit" ? (isEn ? "Bank Deposit" : "إيداع بنكي") :
    payment.method === "cardMachine" ? (isEn ? "Card" : "شبكة / صراف") : payment.method;

  const entryTypeLabel = payment.category === "income" 
    ? (isEn ? "✅ Income" : "✅ إيراد") 
    : (isEn ? "🔴 Expense" : "🔴 مصروف");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { font-family: 'Readex Pro', sans-serif; }
        
        .receipt-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #7a1b32 0%, #5c1425 50%, #3e0c17 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
        }
        
        .controls {
          width: 100%;
          max-width: 600px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        
        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.2s;
        }
        .btn-back:hover { background: rgba(255,255,255,0.2); }
        
        .btn-print {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: linear-gradient(135deg, #7a1b32, #e74c3c);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          box-shadow: 0 4px 16px rgba(138,21,56,0.4);
          transition: all 0.2s;
        }
        .btn-print:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(138,21,56,0.5); }
        
        .receipt-card {
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .receipt-header {
          background: linear-gradient(135deg, #7a1b32, #c0392b);
          padding: 32px;
          color: white;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: right;
        }
        .receipt-header::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 24px solid transparent;
          border-right: 24px solid transparent;
          border-top: 20px solid #c0392b;
        }
        
        .academy-name { font-size: 28px; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
        .receipt-subtitle { font-size: 13px; opacity: 0.85; font-weight: 400; }
        .receipt-number-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 4px 16px;
          background: rgba(255,255,255,0.2);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          direction: ltr;
        }
        
        .receipt-body { padding: 40px 32px 32px; }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
        }
        .info-box {
          background: #f8f9fc;
          border-radius: 14px;
          padding: 16px;
          border: 1px solid #eef1f6;
        }
        .info-label {
          font-size: 11px;
          font-weight: 700;
          color: #8a8a9a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .info-value {
          font-size: 16px;
          font-weight: 700;
          color: #7a1b32;
        }
        
        .amount-card {
          background: linear-gradient(135deg, #7a1b32, #5c1425);
          border-radius: 18px;
          padding: 28px;
          text-align: center;
          color: white;
          margin-bottom: 24px;
        }
        .amount-label { font-size: 13px; opacity: 0.7; margin-bottom: 8px; }
        .amount-value { font-size: 42px; font-weight: 800; letter-spacing: 1px; }
        .amount-currency { font-size: 18px; font-weight: 400; opacity: 0.7; margin-right: 4px; }
        
        .details-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid #f0f2f5;
        }
        .details-row:last-child { border-bottom: none; }
        .detail-key { font-size: 14px; color: #8a8a9a; font-weight: 500; }
        .detail-val { font-size: 14px; color: #7a1b32; font-weight: 700; }
        
        .receipt-footer {
          border-top: 2px dashed #e5e7eb;
          margin: 0 32px;
          padding: 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-size: 12px;
          color: #b0b0c0;
        }
        .signature-line {
          width: 160px;
          border-top: 1px solid #d0d0d0;
          padding-top: 8px;
          text-align: center;
          color: #aaa;
          font-size: 11px;
        }
        .footer-system { text-align: left; direction: ltr; font-size: 11px; }
        
        .receipt-bottom-strip {
          height: 6px;
          background: linear-gradient(90deg, #7a1b32, #e74c3c, #f39c12, #2ecc71, #3498db, #7a1b32);
        }
        
        @media print {
          @page { margin: 0; size: auto; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .controls { display: none !important; }
          .receipt-page {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: 100vh;
            display: block;
          }
          .receipt-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            min-height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            margin: 0 !important;
            page-break-inside: avoid;
          }
          
          .receipt-header { padding: 40px !important; }
          .academy-name { font-size: 38px !important; margin-bottom: 8px !important; }
          .receipt-subtitle { font-size: 16px !important; }
          .receipt-number-badge { margin-top: 16px !important; padding: 6px 20px !important; font-size: 16px !important; }
          .receipt-header::after { bottom: -20px !important; border-top-width: 24px !important; border-left-width: 24px !important; border-right-width: 24px !important; }
          
          .receipt-body { 
            padding: 40px !important; 
            flex-grow: 1 !important; 
            display: flex !important; 
            flex-direction: column !important; 
            justify-content: space-around !important; 
          }
          
          .info-grid { gap: 24px !important; margin-bottom: 0 !important; }
          .info-box { padding: 24px !important; border-radius: 16px !important; }
          .info-label { font-size: 14px !important; margin-bottom: 8px !important; }
          .info-value { font-size: 20px !important; }
          
          .amount-card { padding: 40px !important; margin-bottom: 0 !important; border-radius: 20px !important; }
          .amount-label { font-size: 18px !important; margin-bottom: 12px !important; }
          .amount-value { font-size: 56px !important; }
          .amount-currency { font-size: 22px !important; }
          
          .details-row { padding: 16px 0 !important; }
          .detail-key { font-size: 18px !important; }
          .detail-val { font-size: 18px !important; }
          
          .receipt-footer { margin: 0 40px !important; padding: 24px 0 !important; margin-top: auto !important; }
          .signature-line { width: 200px !important; padding-top: 8px !important; font-size: 14px !important; }
          .footer-system { font-size: 14px !important; }
        }
      `}</style>
      
      <div className="receipt-page">
        {/* Controls - hidden when printing */}
        <div className="controls" style={{ flexDirection: isEn ? "row-reverse" : "row" }}>
          <button className="btn-back" onClick={() => router.back()}>
            <ArrowRight style={{width:18,height:18, transform: isEn ? "rotate(180deg)" : "none"}} />
            {isEn ? "Back" : "رجوع"}
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
                background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
                color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px",
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              {isEn ? "🌐 عربي" : "🌐 English"}
            </button>
            <button className="btn-print" onClick={() => window.print()}>
              <Printer style={{width:18,height:18}} />
              {isEn ? "Print Receipt" : "طباعة الإيصال"}
            </button>
          </div>
        </div>

        {/* Receipt Card */}
        <div className="receipt-card" dir={isEn ? "ltr" : "rtl"}>
          {/* Header */}
          <div className="receipt-header" style={{ textAlign: isEn ? "left" : "right" }}>
            <div>
              <div className="academy-name">{isEn ? "Al Ahli Academy" : "أكاديمية النادي الأهلي"}</div>
              <div className="receipt-subtitle">{isEn ? "Payment Receipt" : "إيصال استلام / Payment Receipt"}</div>
              <div className="receipt-number-badge">#{receiptNumber}</div>
            </div>
            <img src="/logo.png" alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', background: 'white', padding: 4, borderRadius: 8 }} />
          </div>

          {/* Body */}
          <div className="receipt-body">
            {/* Member & Sport Info */}
            <div className="info-grid">
              <div className="info-box">
                <div className="info-label">👤 {isEn ? "Member Name" : "اسم العضو"}</div>
                <div className="info-value">{payment.Member?.fullNameArabic || (isEn ? "Not registered" : "غير مسجل")}</div>
                {payment.Member?.phoneFather && (
                  <div style={{fontSize:12,color:"#999",marginTop:4,direction:"ltr"}}>{payment.Member.phoneFather}</div>
                )}
              </div>
              <div className="info-box">
                <div className="info-label">🏅 {isEn ? "Sport" : "الرياضة"}</div>
                <div className="info-value">{payment.Sport?.name || (isEn ? "General" : "عام")}</div>
              </div>
              <div className="info-box">
                <div className="info-label">📅 {isEn ? "Payment Date" : "تاريخ الدفع"}</div>
                <div className="info-value">{dateFormatted}</div>
              </div>
              <div className="info-box">
                <div className="info-label">📋 {isEn ? "Transaction Type" : "نوع المعاملة"}</div>
                <div className="info-value">{paymentTypeLabel}</div>
              </div>
            </div>

            {/* Amount Card */}
            <div className="amount-card">
              <div className="amount-label">{isEn ? "Amount Paid" : "المبلغ المدفوع"}</div>
              <div className="amount-value">
                {Number(payment.amount || 0).toLocaleString()}
                <span className="amount-currency">{isEn ? "QAR" : "ريال"}</span>
              </div>
            </div>

            {/* Details */}
            <div style={{marginBottom: 8}}>
              <div className="details-row">
                <span className="detail-key">{isEn ? "Payment Method" : "وسيلة الدفع"}</span>
                <span className="detail-val">{methodLabel}</span>
              </div>
              <div className="details-row">
                <span className="detail-key">{isEn ? "Entry Type" : "نوع القيد"}</span>
                <span className="detail-val">{entryTypeLabel}</span>
              </div>
              {payment.notes && (
                <div className="details-row">
                  <span className="detail-key">{isEn ? "Notes" : "ملاحظات"}</span>
                  <span className="detail-val">{payment.notes}</span>
                </div>
              )}
              {endDateFormatted && (
                <div className="details-row">
                  <span className="detail-key">{isEn ? "Valid Until" : "صلاحية الاشتراك حتى"}</span>
                  <span className="detail-val">{endDateFormatted}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <div>
              <div className="signature-line">{isEn ? "Receiver Signature" : "توقيع المستلم"}</div>
            </div>
            <div className="footer-system" style={{ textAlign: isEn ? "right" : "left" }}>
              <div>Generated by system</div>
              <div>{new Date().toLocaleDateString(isEn ? "en-US" : "ar-EG")}</div>
            </div>
          </div>
          
          {/* Bottom colored strip */}
          <div className="receipt-bottom-strip"></div>
        </div>
      </div>
    </>
  );
}
