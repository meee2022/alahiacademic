"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Eye, Trash2, Loader2, Users, Printer, MoreVertical, FileText } from "lucide-react";
import { getMembers, getSports, MemberWithEnrollments } from "@/lib/insforge/queries";
import { insforge } from "@/lib/insforge/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AddMemberModal from "@/app/components/AddMemberModal";

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSport, setActiveSport] = useState<string>("الكل");
  const [members, setMembers] = useState<MemberWithEnrollments[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const router = useRouter();

  const handlePrintReceipt = async (memberId: string) => {
    setPrintingId(memberId);
    try {
      const { data, error } = await insforge.database
        .from("Payment")
        .select("id")
        .eq("memberId", memberId)
        .order("date", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        router.push(`/receipt/${data[0].id}`);
      } else {
        alert("لا يوجد إيصالات مدفوعة لهذا العضو حالياً");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء جلب بيانات الإيصال");
    } finally {
      setPrintingId(null);
    }
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "---";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age + " سنة";
  };

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const [data, sportsData] = await Promise.all([
           getMembers(searchTerm),
           getSports()
        ]);
        setMembers(data);
        setSports(sportsData);
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchMembers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredMembers = members.filter(member => {
    if (activeSport !== "الكل") {
      const memberSports = member.SportsEnrollment?.map(en => en.Sport?.name) || [];
      if (!(memberSports as string[]).includes(activeSport)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary mb-1">إدارة الأعضاء</h1>
          <p className="text-sm font-medium text-gray-500">
            إجمالي {members.length} عضواً مسجلاً في الأكاديمية
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-[#5D1026] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-bold text-sm"
        >
          <Plus className="h-5 w-5" />
          إضافة عضو جديد
        </button>
      </div>

      <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
        {/* Search Bar */}
        <div className="relative max-w-4xl mx-auto mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="البحث بالاسم, الرقم الرياضي أو الرياضة..."
            className="w-full pl-6 pr-12 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary bg-[#F5F5F7] text-gray-900 font-medium transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveSport("الكل")}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeSport === "الكل" ? "bg-secondary text-white shadow-md shadow-secondary/30" : "bg-[#F5F5F7] text-gray-600 hover:bg-gray-200"}`}
          >
            الكل
          </button>
          {sports.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSport(s.name)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeSport === s.name ? "bg-secondary text-white shadow-md shadow-secondary/30" : "bg-[#F5F5F7] text-gray-600 hover:bg-gray-200"}`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {error ? (
          <div className="p-8 text-center text-red-500 font-bold">{error}</div>
        ) : loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium text-lg">لا يوجد نتائج تطابق بحثك</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map(member => {
              const memberSports = member.SportsEnrollment && member.SportsEnrollment.length > 0 
                ? Array.from(new Set(member.SportsEnrollment.map(en => en.Sport?.name).filter(Boolean))).join("، ") 
                : "بدون رياضة";
              const isActive = member.SportsEnrollment?.some(en => en.status === "active");

              return (
                <div key={member.id} className="bg-white rounded-[20px] p-5 shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-primary/10 flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                    <div className="flex gap-2">
                      <Link href={`/admin/members/${member.id}/card`} className="text-gray-400 hover:text-primary p-1.5 bg-gray-50 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100" title="طباعة بطاقة العضوية">
                        <Printer className="h-4 w-4" />
                      </Link>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePrintReceipt(member.id); }} disabled={printingId === member.id} className="text-gray-400 hover:text-secondary p-1.5 bg-gray-50 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-amber-100 disabled:opacity-50" title="طباعة آخر إيصال">
                        {printingId === member.id ? <Loader2 className="h-4 w-4 animate-spin text-secondary" /> : <FileText className="h-4 w-4" />}
                      </button>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide ${isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                      {isActive ? "نشط" : "منتهي"}
                    </span>
                  </div>

                  <Link href={`/admin/members/${member.id}`} className="flex flex-col items-center mb-6 group cursor-pointer hover:opacity-80 transition-opacity text-center">
                    <div className="h-20 w-20 rounded-full bg-[#F5F5F7] border-[3px] border-white shadow-md mb-3 flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-all relative">
                      {member.photoUrl && member.photoUrl !== "undefined" ? (
                        <img src={member.photoUrl} alt={member.fullNameArabic} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-primary leading-tight mb-1">{member.fullNameArabic}</h3>
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-[11px] text-gray-500 font-bold font-almarai">الرقم الشخصي: <span className="font-mono">{member.nationalId || "---"}</span></p>
                      <p className="text-[11px] text-secondary font-black font-almarai underline decoration-secondary/30 underline-offset-2">العمر: {calculateAge(member.dateOfBirth)}</p>
                    </div>
                  </Link>
                  <div className="mt-auto pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {member.SportsEnrollment && member.SportsEnrollment.length > 0 ? (
                        member.SportsEnrollment.map((enrollment, index) => (
                          <div key={enrollment.id || index} className={`flex flex-col flex-1 items-center text-center ${index > 0 ? 'border-r pr-2 border-gray-100' : ''} min-w-[45%]`}>
                            <span className="text-[9px] text-gray-400 font-bold tracking-wider mb-1">{enrollment.Sport?.name || "الرياضة"}</span>
                            <span className="text-[11px] font-bold text-primary">
                              {new Date(enrollment.subscriptionEnd).toLocaleDateString('en-GB').replace(/\//g, " / ")}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 text-[11px] font-medium w-full py-1">لا يوجد اشتراك مضاف</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Member Card Placeholder */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#F5F5F7]/50 rounded-[20px] p-5 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[250px] hover:border-primary hover:bg-[#F5F5F7] transition-all group"
            >
              <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">إضافة عضو</span>
            </button>
          </div>
        )}
      </div>

      <AddMemberModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
           setLoading(true);
           getMembers(searchTerm).then(setMembers).finally(() => setLoading(false));
        }}
        sports={sports}
      />
    </div>
  );
}
