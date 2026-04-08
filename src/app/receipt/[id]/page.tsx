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

  const receiptNumber = payment.id?.split("-")[0].toUpperCase();
  const dateFormatted = new Date(payment.date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const endDateFormatted = payment.endOfSubscriptionDate 
    ? new Date(payment.endOfSubscriptionDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const paymentTypeLabel = 
    payment.paymentType === "subscription" ? "اشتراك تدريب" : 
    payment.paymentType === "belt" ? "اختبار حزام" : 
    payment.paymentType === "uniform" ? "زي رياضي" : "أخرى";

  const methodLabel = 
    payment.method === "cash" ? "نقدي (كاش)" :
    payment.method === "transferATM" ? "تحويل بنكي" :
    payment.method === "cardMachine" ? "شبكة / صراف" : "إيداع بنكي";

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
          text-align: center;
          color: white;
          position: relative;
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
            min-height: auto;
            display: block;
          }
          .receipt-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          /* aggressively reduce heights and spacing to fit on one page */
          .receipt-header { padding: 16px !important; }
          .academy-name { font-size: 22px !important; margin-bottom: 2px !important; }
          .receipt-subtitle { font-size: 11px !important; }
          .receipt-number-badge { margin-top: 6px !important; padding: 2px 12px !important; }
          .receipt-header::after { bottom: -12px !important; border-top-width: 16px !important; border-left-width: 16px !important; border-right-width: 16px !important; }
          
          .receipt-body { padding: 24px 20px 12px !important; }
          .info-grid { gap: 12px !important; margin-bottom: 16px !important; }
          .info-box { padding: 10px !important; }
          .info-label { font-size: 10px !important; margin-bottom: 4px !important; }
          .info-value { font-size: 14px !important; }
          
          .amount-card { padding: 16px !important; margin-bottom: 16px !important; border-radius: 12px !important; }
          .amount-label { font-size: 11px !important; margin-bottom: 4px !important; }
          .amount-value { font-size: 28px !important; }
          .amount-currency { font-size: 14px !important; }
          
          .details-row { padding: 8px 0 !important; }
          .detail-key { font-size: 12px !important; }
          .detail-val { font-size: 12px !important; }
          
          .receipt-footer { margin: 0 16px !important; padding: 12px 0 !important; margin-top: 8px !important; }
          .signature-line { width: 120px !important; padding-top: 4px !important; font-size: 10px !important; }
          .footer-system { font-size: 10px !important; }
        }
      `}</style>
      
      <div className="receipt-page">
        {/* Controls - hidden when printing */}
        <div className="controls">
          <button className="btn-back" onClick={() => router.back()}>
            <ArrowRight style={{width:18,height:18}} />
            رجوع
          </button>
          <button className="btn-print" onClick={() => window.print()}>
            <Printer style={{width:18,height:18}} />
            طباعة الإيصال
          </button>
        </div>

        {/* Receipt Card */}
        <div className="receipt-card">
          {/* Header */}
          <div className="receipt-header flex justify-between items-center text-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'right' }}>
            <div>
              <div className="academy-name">أكاديمية النادي الأهلي</div>
              <div className="receipt-subtitle">إيصال استلام نقدية / Payment Receipt</div>
              <div className="receipt-number-badge">#{receiptNumber}</div>
            </div>
            <img src="/logo.png" alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', background: 'white', padding: 4, borderRadius: 8 }} />
          </div>

          {/* Body */}
          <div className="receipt-body">
            {/* Member & Sport Info */}
            <div className="info-grid">
              <div className="info-box">
                <div className="info-label">👤 اسم العضو</div>
                <div className="info-value">{payment.Member?.fullNameArabic || "غير مسجل"}</div>
                {payment.Member?.phoneFather && (
                  <div style={{fontSize:12,color:"#999",marginTop:4,direction:"ltr"}}>{payment.Member.phoneFather}</div>
                )}
              </div>
              <div className="info-box">
                <div className="info-label">🏅 الرياضة</div>
                <div className="info-value">{payment.Sport?.name || "عام"}</div>
              </div>
              <div className="info-box">
                <div className="info-label">📅 تاريخ الدفع</div>
                <div className="info-value">{dateFormatted}</div>
              </div>
              <div className="info-box">
                <div className="info-label">📋 نوع العملية</div>
                <div className="info-value">{paymentTypeLabel}</div>
              </div>
            </div>

            {/* Amount Card */}
            <div className="amount-card">
              <div className="amount-label">الإجمالي المدفوع</div>
              <div className="amount-value">
                {payment.amount.toLocaleString()}
                <span className="amount-currency">ريال</span>
              </div>
            </div>

            {/* Details */}
            <div style={{marginBottom: 8}}>
              <div className="details-row">
                <span className="detail-key">وسيلة الدفع</span>
                <span className="detail-val">{methodLabel}</span>
              </div>
              {endDateFormatted && (
                <div className="details-row">
                  <span className="detail-key">صلاحية الاشتراك حتى</span>
                  <span className="detail-val">{endDateFormatted}</span>
                </div>
              )}
              {payment.description && (
                <div className="details-row">
                  <span className="detail-key">ملاحظات</span>
                  <span className="detail-val">{payment.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <div>
              <div className="signature-line">توقيع المستلم</div>
            </div>
            <div className="footer-system">
              <div>Generated by system</div>
              <div>{new Date().toLocaleDateString("ar-EG")}</div>
            </div>
          </div>
          
          {/* Bottom colored strip */}
          <div className="receipt-bottom-strip"></div>
        </div>
      </div>
    </>
  );
}
