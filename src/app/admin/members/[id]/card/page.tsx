"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowRight, Loader2, UserCircle } from "lucide-react";
import { getMemberById, getMemberSequentialNumber } from "@/lib/insforge/queries";

export default function MembershipCardPage() {
  const { id } = useParams();
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [membershipNumber, setMembershipNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    async function fetchMember() {
      if (!id || typeof id !== "string") return;
      try {
        const data = await getMemberById(id);
        setMember(data);
        if (data?.createdAt) {
          const seqNum = await getMemberSequentialNumber(id, data.createdAt);
          setMembershipNumber(seqNum);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMember();
  }, [id]);

  const calculateAge = (dob: string | null) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#fdfaf6]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#fdfaf6] text-gray-500">
        لم يتم العثور على بيانات العضو
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const t = {
    ar: {
      academy: "أكاديمية النادي الأهلي",
      subtitle: "لفنون الدفاع عن النفس",
      memNo: "رقم العضوية:",
      natId: "الرقم الشخصي:",
      age: "العمر:",
      sport: "الرياضة الأبرز:",
      issueDate: "تاريخ الإصدار:",
      years: "سنة",
      none: "بدون"
    },
    en: {
      academy: "Al Ahly Club Academy",
      subtitle: "For Martial Arts",
      memNo: "Membership No:",
      natId: "National ID:",
      age: "Age:",
      sport: "Main Sport:",
      issueDate: "Issue Date:",
      years: "Years",
      none: "None"
    }
  }[language];

  return (
    <div className="min-h-screen print:min-h-0 bg-[#f8f5f0] print:bg-transparent p-8 print:p-0 flex flex-col items-center print:block">
      {/* أدوات التحكم (مخفية عند الطباعة) */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-[#fdfaf6] transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
          العودة للملف
        </button>
        <div className="flex items-center gap-3">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
            className="px-3 py-2 bg-white rounded-lg shadow-sm text-gray-700 text-sm font-bold border border-gray-100 outline-none cursor-pointer focus:ring-2 focus:ring-primary/20"
          >
            <option value="ar">اللغة العربية</option>
            <option value="en">English Language</option>
          </select>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-[#5c1425] transition-colors"
          >
            <Printer className="h-5 w-5" />
            طباعة البطاقة
          </button>
        </div>
      </div>

      {/* منطقة البطاقة (حجم البطاقة القياسي تقريباً) */}
      <div id="print-section" dir={language === 'ar' ? 'rtl' : 'ltr'} className="print-card relative rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:m-0 border border-black/10 flex flex-col p-4 print:rounded-none print:border-none box-border mx-auto" style={{ 
        width: "85.6mm", 
        height: "54mm", 
        background: "linear-gradient(135deg, #7a1b32, #5A0B1A)",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact"
      }}>
        {/* تأثيرات لمعان خفيفة للخلفية */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white opacity-[0.03] rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="flex justify-between items-start relative z-10 w-full">
           {/* Title Block (Language-aware positioning) */}
           <div className="border border-[#C5A059]/40 rounded-md px-3 py-1 flex flex-col items-center justify-center bg-black/20 shadow-sm print:border-[#C5A059] print:bg-black/20 mt-0.5">
             <h1 className="text-[12px] leading-tight font-black text-[#C5A059] tracking-wider mb-0.5">{t.academy}</h1>
             <h2 className="text-[9px] leading-tight font-medium text-gray-200">{t.subtitle}</h2>
           </div>

           {/* Logo */}
           <div className="w-[38px] h-[38px] rounded-full border border-white/10 bg-white flex items-center justify-center shadow-sm p-1 overflow-hidden print:border-none">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
           </div>
        </div>

        {/* Middle Content */}
        <div className="flex-1 flex mt-2 gap-3 items-center relative z-10 w-full mb-1">
          
          {/* Picture - Rendered first so it appears on the right in RTL */}
          <div className="w-[70px] h-[90px] shrink-0 rounded-md border-[1.5px] border-white/20 overflow-hidden shadow-sm bg-black/10 flex items-center justify-center relative print:border-white/50 print:shadow-none box-border">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt="صورة العضو" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-8 h-8 text-white/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none print:hidden"></div>
          </div>

          {/* Text Data (Centered text block) */}
          <div className="flex-1 flex flex-col justify-center text-white min-w-0 px-1 print:text-white pt-1">
            <h3 className="text-[14px] leading-tight font-bold text-center drop-shadow-sm mb-0.5 truncate px-1 print:drop-shadow-none" dir={language === 'en' ? 'ltr' : 'rtl'}>
              {language === 'ar' ? member.fullNameArabic : (member.fullNameEnglish || member.fullNameArabic)}
            </h3>
            {member.fullNameEnglish && language === 'ar' && (
              <p className="text-[9px] leading-tight text-white/90 font-medium text-center uppercase tracking-widest mb-2 drop-shadow-sm truncate print:drop-shadow-none" dir="ltr">{member.fullNameEnglish}</p>
            )}
            {member.fullNameArabic && language === 'en' && (
              <p className="text-[9px] leading-tight text-white/90 font-medium text-center tracking-widest mb-2 drop-shadow-sm truncate print:drop-shadow-none" dir="rtl">{member.fullNameArabic}</p>
            )}
            {!member.fullNameEnglish && language === 'en' && <div className="mb-2"></div>}
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-center mt-1">
              <div className="flex flex-col items-center">
                <span className="text-[8.5px] leading-tight font-bold text-[#C5A059] mb-0.5 print:text-[#C5A059] drop-shadow-sm print:drop-shadow-none">{t.memNo}</span>
                <span className="text-[10px] leading-tight font-mono tracking-wider">{membershipNumber ? `10${membershipNumber}` : "..."}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8.5px] leading-tight font-bold text-[#C5A059] mb-0.5 print:text-[#C5A059] drop-shadow-sm print:drop-shadow-none">{t.natId}</span>
                <span className="text-[10px] leading-tight font-mono tracking-wider mt-0.5">{member.nationalId || "-"}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-[8.5px] leading-tight font-bold text-[#C5A059] mb-0.5 print:text-[#C5A059] drop-shadow-sm print:drop-shadow-none">{t.age}</span>
                <span className="text-[10px] leading-tight mt-0.5">{calculateAge(member.dateOfBirth)} {t.years}</span>
              </div>
              <div className="flex flex-col items-center overflow-hidden">
                <span className="text-[8.5px] leading-tight font-bold text-[#C5A059] mb-0.5 print:text-[#C5A059] drop-shadow-sm print:drop-shadow-none">{t.sport}</span>
                <span className="text-[10px] leading-tight truncate w-full">{member.SportsEnrollment?.[0]?.Sport?.name || t.none}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex justify-between items-end relative z-10 w-full pt-1.5">
          <span className="text-[9px] leading-none font-black tracking-wider text-[#C5A059] uppercase drop-shadow-sm print:drop-shadow-none" dir="ltr">
            MEMBERSHIP CARD
          </span>
          <span className="text-[8.5px] leading-none text-gray-300 font-mono flex items-center gap-1 print:text-gray-200" dir="ltr">
            <span className="text-red-200/80 font-sans font-medium print:text-red-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>{t.issueDate}</span> 
            {new Date().toLocaleDateString('en-US')}
          </span>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          /* Remove @page size. Let printer fallback to default (A4), avoiding zoom distortion completely */
          body * {
            visibility: hidden;
          }

          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          #print-section, #print-section * {
            visibility: visible;
          }
          
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
            transform: none !important;
            /* Force exact sizing over browser presets */
            width: 85.6mm !important;
            height: 54mm !important;
            max-width: 85.6mm !important;
            max-height: 54mm !important;
          }
        }
      `}</style>
    </div>
  );
}
