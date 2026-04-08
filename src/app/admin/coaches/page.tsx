"use client";

import { useEffect, useState, useRef } from "react";
import { Award, Plus, Loader2, Edit, Trash2, X, Save, Search, Users, Calendar, Eye, Phone, TrendingUp, DollarSign, UploadCloud, UserCircle } from "lucide-react";
import { insforge } from "@/lib/insforge/client";

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [sportsCount, setSportsCount] = useState<Record<string, number>>({});
  const [sportsIncome, setSportsIncome] = useState<Record<string, number>>({});
  const [paidStudentsCount, setPaidStudentsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCoach, setEditingCoach] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  
  // New UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSportFilter, setActiveSportFilter] = useState("الكل");

  const [form, setForm] = useState({ fullName: "", phone: "", sportId: "", baseSalary: "", CoachsalaryPercentage: "", note: "", photoUrl: "" });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const uploadedRemoteUrl = useRef<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      
      const [coachRes, sportRes, enrollmentsRes, paymentsRes] = await Promise.all([
        insforge.database.from("Coach").select("*, Sport(name)").order("fullName", { ascending: true }),
        insforge.database.from("Sport").select("id, name").eq("isActive", true),
        insforge.database.from("SportsEnrollment").select("sportId").eq("status", "active"),
        insforge.database.from("Payment").select("sportId, amount, memberId, paymentType").eq("category", "income").gte("date", startOfMonth)
      ]);
      if (coachRes.error || sportRes.error || enrollmentsRes.error || paymentsRes.error) {
        let msg = "";
        if (coachRes.error) msg += `Coach Error: ${JSON.stringify(coachRes.error)}\n`;
        if (sportRes.error) msg += `Sport Error: ${JSON.stringify(sportRes.error)}\n`;
        if (enrollmentsRes.error) msg += `Enrollments Error: ${JSON.stringify(enrollmentsRes.error)}\n`;
        if (paymentsRes.error) msg += `Payments Error: ${JSON.stringify(paymentsRes.error)}\n`;
        setErrorMsg(msg);
      }

      if (coachRes.data) setCoaches(coachRes.data);
      if (sportRes.data) setSports(sportRes.data);
      
      if (enrollmentsRes.data) {
        const counts: Record<string, number> = {};
        enrollmentsRes.data.forEach((en: any) => {
           counts[en.sportId] = (counts[en.sportId] || 0) + 1;
        });
        setSportsCount(counts);
      }
      
      if (paymentsRes.data) {
        const incomeMap: Record<string, number> = {};
        const paidStudentsMap: Record<string, Set<string>> = {};
        
        paymentsRes.data.forEach((p: any) => {
          // Filter to only count subscription-related income for the coach's percentage
          if (p.sportId && p.paymentType === "subscription") {
            incomeMap[p.sportId] = (incomeMap[p.sportId] || 0) + Number(p.amount);
            
            if (!paidStudentsMap[p.sportId]) paidStudentsMap[p.sportId] = new Set();
            if (p.memberId) paidStudentsMap[p.sportId].add(p.memberId);
          }
        });
        
        setSportsIncome(incomeMap);
        
        const counts: Record<string, number> = {};
        Object.entries(paidStudentsMap).forEach(([sportId, membersSet]) => {
          counts[sportId] = membersSet.size;
        });
        setPaidStudentsCount(counts);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) { alert("يرجى إدخال اسم المدرب"); return; }
    setSaving(true);
    try {
      // CRITICAL: Never save blob: URLs to DB. Use the ref that stores the real remote URL.
      let finalPhotoUrl: string | null = null;
      if (uploadedRemoteUrl.current) {
        finalPhotoUrl = uploadedRemoteUrl.current;
      } else if (form.photoUrl && !form.photoUrl.startsWith('blob:')) {
        finalPhotoUrl = form.photoUrl;
      } else if (editingCoach?.photoUrl && !editingCoach.photoUrl.startsWith('blob:')) {
        finalPhotoUrl = editingCoach.photoUrl;
      }

      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        sportId: form.sportId || null,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : null,
        CoachsalaryPercentage: form.CoachsalaryPercentage ? Number(form.CoachsalaryPercentage) : null,
        note: form.note.trim() || null,
        photoUrl: finalPhotoUrl
      };

      if (editingCoach) {
        const { error } = await insforge.database.from("Coach").update(payload).eq("id", editingCoach.id);
        if (error) throw error;
      } else {
        const { error } = await insforge.database.from("Coach").insert(payload);
        if (error) throw error;
      }
      setShowModal(false);
      uploadedRemoteUrl.current = null;
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ:\n" + JSON.stringify(err, null, 2));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المدرب "${name}"؟`)) return;
    try {
      const { error } = await insforge.database.from("Coach").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const calculateCoachSalary = (coach: any) => {
    const sportIncome = coach.sportId ? (sportsIncome[coach.sportId] || 0) : 0;
    const percentageAmount = coach.CoachsalaryPercentage ? (sportIncome * (coach.CoachsalaryPercentage / 100)) : 0;
    const total = (coach.baseSalary || 0) + percentageAmount;
    return {
      base: coach.baseSalary || 0,
      incentives: Math.round(percentageAmount),
      total: Math.round(total)
    };
  };

  // Compress image before upload for faster loading
  const compressImage = (file: File, maxSize = 400): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize; }
          else { width = (width / height) * maxSize; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.75);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingPhoto(true);
    
    // Create local preview for modal display only
    const localPreviewUrl = URL.createObjectURL(file);
    setLocalPreview(localPreviewUrl);
    
    try {
      // Compress image before upload
      const compressed = await compressImage(file);
      const storageKey = `coaches/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const { data: uploadData, error: uploadError } = await insforge.storage
        .from("members-docs")
        .upload(storageKey, compressed);
      if (uploadError) throw uploadError;
      if (!uploadData) throw new Error("لم يتم إرجاع بيانات الرفع");
      
      // Use manual public URL (same format that works for members)
      const remoteUrl = `https://pzqe7ma6.ap-southeast.insforge.app/storage/v1/object/public/members-docs/${uploadData.key}`;
      console.log("Photo uploaded. Public URL:", remoteUrl);
      
      // Store remote URL in ref (NEVER loses it, immune to re-renders)
      uploadedRemoteUrl.current = remoteUrl;
      setForm(prev => ({ ...prev, photoUrl: remoteUrl }));
      
      // Auto-save photo for existing coach immediately
      if (editingCoach) {
        const { error: updateError } = await insforge.database.from("Coach").update({ photoUrl: remoteUrl }).eq("id", editingCoach.id);
        if (updateError) console.error("Auto-save photo error:", updateError);
        // Update local coaches array so card refreshes immediately
        setCoaches(prev => prev.map(c => c.id === editingCoach.id ? { ...c, photoUrl: remoteUrl } : c));
      }
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      alert("تعذر رفع الصورة: " + (err?.message || JSON.stringify(err)));
      setLocalPreview(null);
      uploadedRemoteUrl.current = null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const filteredCoaches = coaches.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.phone && c.phone.includes(searchTerm));
    const matchesSport = activeSportFilter === "الكل" || c.Sport?.name === activeSportFilter;
    return matchesSearch && matchesSport;
  });

  const totalSalaries = coaches.reduce((acc, c) => acc + calculateCoachSalary(c).total, 0);
  const nextPayoutDate = "28 " + new Date().toLocaleDateString('ar-QA', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-7 pb-20 font-sans">
      
      {/* === TOP SUMMARY SECTION === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Total Salaries Card */}
        <div className="lg:col-span-8 bg-[#5A0B1A] rounded-[28px] p-8 text-white relative overflow-hidden shadow-xl border border-[#8A1538]/20 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-1">
              <p className="text-white/60 text-xs font-bold tracking-[0.15em] uppercase">إجمالي الرواتب الشهرية</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black leading-none tracking-tighter" dir="ltr">{totalSalaries.toLocaleString()}</span>
                <span className="text-[#C5A059] font-bold text-sm">ر.ق</span>
              </div>
            </div>

            <div className="mt-8 bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4 w-fit">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#C5A059]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">تاريخ الصرف القادم</p>
                <p className="text-sm font-black">{nextPayoutDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Coaches Card */}
        <div className="lg:col-span-4 bg-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between group hover:border-[#C5A059]/30 transition-all">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF8F9] flex items-center justify-center border border-[#8A1538]/10 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-[#8A1538]" />
            </div>
            <div className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">+2 هذا الشهر</div>
          </div>
          
          <div>
            <p className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-1">إجمالي المدربين</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#5A0B1A]">{coaches.length}</span>
              <span className="text-gray-400 font-bold text-xs capitalize">مدرب معتمد</span>
            </div>
          </div>
        </div>
      </div>

      {/* === SEARCH & FILTERS === */}
      <div className="bg-white/50 backdrop-blur-sm rounded-[24px] p-4 border border-white flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="البحث عن مدرب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-full py-3 pr-10 pl-4 text-sm font-bold focus:ring-2 focus:ring-[#8A1538]/10 focus:border-[#8A1538] transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full">
          <button 
            onClick={() => setActiveSportFilter("الكل")}
            className={`px-6 py-2.5 rounded-full text-xs font-black transition-all ${activeSportFilter === "الكل" ? 'bg-[#5A0B1A] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >الكل</button>
          {sports.map(s => (
            <button 
              key={s.id}
              onClick={() => setActiveSportFilter(s.name)}
              className={`px-6 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${activeSportFilter === s.name ? 'bg-[#5A0B1A] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >{s.name}</button>
          ))}
        </div>
      </div>

      {/* === COACH CARDS GRID === */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/30 backdrop-blur-md rounded-[28px] border border-white">
          <Loader2 className="w-10 h-10 animate-spin text-[#8A1538] mb-4" />
          <p className="text-sm font-bold text-[#5A0B1A]/60">جاري تحميل بيانات الكباتن...</p>
        </div>
      ) : errorMsg ? (
        <div className="text-center py-20 bg-rose-50/80 backdrop-blur-md rounded-[28px] border-2 border-rose-200">
           <p className="text-xl font-black text-rose-600 mb-2">حدث خطأ أثناء جلب البيانات</p>
           <pre className="text-xs text-rose-500 font-mono text-left w-fit mx-auto bg-white p-4 rounded-xl border border-rose-100">{errorMsg}</pre>
        </div>
      ) : filteredCoaches.length === 0 ? (
        <div className="text-center py-20 bg-white/30 backdrop-blur-md rounded-[28px] border border-dashed border-gray-200">
           <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
           <p className="text-gray-400 font-bold">لم يتم العثور على مدربين يطابقون بحثك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach) => {
            const salary = calculateCoachSalary(coach);
            return (
              <div key={coach.id} className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50 flex flex-col relative group transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 rounded-bl-[100px] -z-10"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#8A1538]/5 rounded-tr-[100px] -z-10"></div>
                
                {/* Card Header: Avatar & Name */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col">
                    <div className="bg-[#fcecc2] text-[#bc8c20] px-3 py-1 rounded-full text-[10px] font-black tracking-widest w-fit mb-2 shadow-sm border border-[#bc8c20]/10">كابتن معتمد</div>
                    <h3 className="text-[#5A0B1A] text-lg font-black leading-tight font-almarai">ك. {coach.fullName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#C5A059] shadow-[0_0_5px_rgba(197,160,89,0.5)]"></div>
                      <p className="text-[11px] text-gray-400 font-bold tracking-wide uppercase">
                        {coach.Sport?.name || "عام"} · {paidStudentsCount[coach.sportId] || 0} مدفوع / {sportsCount[coach.sportId] || 0} مسجل
                      </p>
                    </div>
                  </div>
                  
                  {/* Premium Avatar */}
                  <div className="w-20 h-20 rounded-[22px] bg-white border border-gray-100 shadow-[0_8px_16px_rgb(0,0,0,0.06)] overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {coach.photoUrl && !coach.photoUrl.startsWith('blob:') ? (
                      <img 
                        src={coach.photoUrl} 
                        alt={coach.fullName} 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.fullName}`; }}
                      />
                    ) : (
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.fullName}`} 
                        alt={coach.fullName} 
                        className="w-full h-full object-cover bg-gray-50 scale-110" 
                      />
                    )}
                  </div>
                </div>

                {/* Salary Breakdown Grid (3 columns) */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-[#F5F5F7] rounded-2xl p-3 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">الأساسي</span>
                    <span className="text-sm font-black text-[#5A0B1A]">{salary.base.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#F5F5F7] rounded-2xl p-3 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">الحوافز</span>
                    <span className="text-sm font-black text-[#bc8c20]">{salary.incentives.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#8A1538] rounded-2xl p-3 flex flex-col items-center justify-center shadow-lg shadow-[#8A1538]/20">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-tighter mb-1">الإجمالي</span>
                    <span className="text-sm font-black text-white">{salary.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Contact & Note */}
                <div className="flex items-center gap-3 mb-6 px-1">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{coach.phone || "لا يوجد هاتف"}</p>
                    {coach.note && <p className="text-[11px] text-gray-500 font-medium truncate">{coach.note}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 mt-auto">
                  <button 
                    onClick={() => {
                      setEditingCoach(coach);
                      setLocalPreview(null);
                      uploadedRemoteUrl.current = null;
                      setForm({
                        fullName: coach.fullName || "",
                        phone: coach.phone || "",
                        sportId: coach.sportId || "",
                        baseSalary: coach.baseSalary?.toString() || "",
                        CoachsalaryPercentage: coach.CoachsalaryPercentage?.toString() || "",
                        note: coach.note || "",
                        photoUrl: coach.photoUrl || ""
                      });
                      setShowModal(true);
                    }}
                    className="flex-1 bg-[#F5F5F7] hover:bg-gray-100 text-[#5A0B1A] py-3.5 rounded-[18px] font-black text-xs transition-all flex items-center justify-center gap-2"
                  >
                    تعديل البيانات
                  </button>
                  <button className="w-14 h-14 bg-white border border-gray-100 rounded-[18px] flex items-center justify-center text-gray-400 hover:text-[#8A1538] hover:bg-[#FDF8F9] transition-all">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                {/* Delete Button (Optional, can be hidden or moved) */}
                <button 
                  onClick={() => handleDelete(coach.id, coach.fullName)}
                  className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white border border-gray-100 text-gray-300 hover:text-rose-500 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Button */}
      <button 
        onClick={() => {
          setEditingCoach(null);
          setLocalPreview(null);
          uploadedRemoteUrl.current = null;
          setForm({ fullName: "", phone: "", sportId: "", baseSalary: "", CoachsalaryPercentage: "", note: "", photoUrl: "" });
          setShowModal(true);
        }}
        className="fixed bottom-10 left-10 w-16 h-16 bg-[#C5A059] text-white rounded-[24px] shadow-2xl flex items-center justify-center hover:scale-110 hover:shadow-[#C5A059]/40 active:scale-95 transition-all z-40 group"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* === MODAL (Updated Design) === */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-[#FDF8F9] px-8 py-6 border-b border-gray-100 flex items-center justify-between">
               <div>
                 <h2 className="text-xl font-black text-[#5A0B1A]">{editingCoach ? "تعديل بيانات الكابتن" : "إضافة مدرب جديد"}</h2>
                 <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-0.5">سجل المدربين والرواتب</p>
               </div>
               <button onClick={() => setShowModal(false)} className="p-3 bg-white text-gray-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-8 space-y-6">
              
              {/* Photo Upload Area */}
              <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
                <div className="relative group w-[72px] h-[72px] rounded-[22px] overflow-hidden bg-gray-50 border border-gray-200 shadow-sm shrink-0 flex items-center justify-center">
                  {(localPreview || form.photoUrl || editingCoach?.photoUrl) ? (
                    <img src={localPreview || form.photoUrl || editingCoach?.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-gray-300" />
                  )}
                  <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud className="w-5 h-5 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  </label>
                  {uploadingPhoto && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#8A1538]" /></div>}
                </div>
                <div>
                  <h3 className="text-[#5A0B1A] font-black text-sm">صورة المدرب</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">اضغط على المربع لاختيار صورة</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">الاسم الكامل *</label>
                  <input 
                    type="text" 
                    value={form.fullName} 
                    onChange={e => setForm({...form, fullName: e.target.value})}
                    className="w-full bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#8A1538]/20 focus:ring-4 focus:ring-[#8A1538]/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] transition-all outline-none"
                    placeholder="ك. أحمد محمد"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">رقم الهاتف</label>
                    <input 
                      type="tel" 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})}
                      className="w-full bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#8A1538]/20 focus:ring-4 focus:ring-[#8A1538]/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] transition-all outline-none"
                      placeholder="5500XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">الراتب الأساسي</label>
                    <input 
                      type="number" 
                      value={form.baseSalary} 
                      onChange={e => setForm({...form, baseSalary: e.target.value})}
                      className="w-full bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#8A1538]/20 focus:ring-4 focus:ring-[#8A1538]/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] transition-all outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">التخصص / الرياضة</label>
                    <select 
                      value={form.sportId} 
                      onChange={e => setForm({...form, sportId: e.target.value})}
                      className="w-full bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#8A1538]/20 focus:ring-4 focus:ring-[#8A1538]/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] transition-all outline-none appearance-none"
                    >
                      <option value="">عام (بدون تخصص)</option>
                      {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">النسبة المئوية (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={form.CoachsalaryPercentage} 
                      onChange={e => setForm({...form, CoachsalaryPercentage: e.target.value})}
                      className="w-full bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#8A1538]/20 focus:ring-4 focus:ring-[#8A1538]/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] transition-all outline-none"
                      placeholder="50%"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">ملاحظات إضافية</label>
                  <textarea 
                    rows={2} 
                    value={form.note} 
                    onChange={e => setForm({...form, note: e.target.value})}
                    className="w-full bg-[#F5F5F7] border-transparent focus:bg-white focus:border-[#8A1538]/20 focus:ring-4 focus:ring-[#8A1538]/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] transition-all outline-none resize-none"
                    placeholder="أي معلومات إضافية عن المدرب..."
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#FDF8F9] border-t border-gray-100 flex gap-4">
               <button 
                 onClick={() => setShowModal(false)}
                 className="flex-1 bg-white border border-gray-200 text-gray-400 py-4 rounded-2xl font-black text-xs hover:bg-gray-50 transition-all"
               >إلغاء</button>
               <button 
                 onClick={handleSave} 
                 disabled={saving || uploadingPhoto}
                 className="flex-[2] bg-[#8A1538] text-white py-4 rounded-2xl font-black text-xs hover:bg-[#5A0B1A] shadow-xl shadow-[#8A1538]/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
               >
                 {(saving || uploadingPhoto) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                 {editingCoach ? "حفظ التعديلات" : "إضافة الكابتن"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
