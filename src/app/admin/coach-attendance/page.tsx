"use client";

import { useEffect, useState } from "react";
import { 
  CalendarCheck, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Save, 
  Users, 
  Calendar, 
  Filter,
  Search,
  ChevronDown,
  User,
  MoreVertical,
  Check,
  X,
  LayoutGrid
} from "lucide-react";
import { insforge } from "@/lib/insforge/client";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  present:  { label: "حاضر",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  absent:   { label: "غائب",   color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    icon: XCircle },
  late:     { label: "متأخر",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock },
  excused:  { label: "إذن",    color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: AlertTriangle },
};

export default function CoachAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [selectedSport, setSelectedSport] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  useEffect(() => { 
    if (coaches.length) { 
      fetchAttendance(); 
    } 
  }, [date, coaches]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const { data: coachesData } = await insforge.database
        .from("Coach")
        .select("id, fullName, photoUrl, Sport(id, name)")
        .order("fullName");
      
      const { data: sportsData } = await insforge.database
        .from("Sport")
        .select("id, name")
        .order("name");

      if (coachesData) setCoaches(coachesData);
      if (sportsData) setSports(sportsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAttendance() {
    const { data, error } = await insforge.database
      .from("CoachAttendance")
      .select("coachId, status, notes")
      .eq("date", date);
    
    if (error) {
      console.warn("Could not fetch attendance (table might be missing):", error);
      return;
    }

    const map: Record<string, string> = {};
    const notesMap: Record<string, string> = {};
    
    (data || []).forEach((a: any) => {
      map[a.coachId] = a.status;
      notesMap[a.coachId] = a.notes || "";
    });
    
    setAttendance(map);
    setNotes(notesMap);
  }

  const markAllAsPresent = () => {
    const newAttendance = { ...attendance };
    filteredCoaches.forEach(coach => {
      if (!newAttendance[coach.id]) {
        newAttendance[coach.id] = "present";
      }
    });
    setAttendance(newAttendance);
  };

  // Helper to read error from InsForge/Supabase SDK (properties may be non-enumerable)
  function extractError(err: any): string {
    if (!err) return "خطأ غير محدد";
    // Try common fields (may be non-enumerable)
    const msg = err.message || err.msg || err.error_description || err.error || err.hint || err.details || err.code;
    if (msg) return String(msg);
    // Try to read all own properties including non-enumerable
    const keys = Object.getOwnPropertyNames(err);
    if (keys.length > 0) {
      return keys.map(k => `${k}: ${err[k]}`).join(" | ");
    }
    return err.toString?.() || "خطأ غير معروف";
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      for (const coach of coaches) {
        const payload = {
          coachId: coach.id,
          date,
          status: attendance[coach.id] || "absent",
          notes: notes[coach.id] || null
        };

        const { data: existing, error: checkErr } = await insforge.database
          .from("CoachAttendance")
          .select("id")
          .eq("coachId", coach.id)
          .eq("date", date)
          .maybeSingle();

        if (checkErr) throw new Error(extractError(checkErr));

        let saveError;
        if (existing?.id) {
          const { error } = await insforge.database
            .from("CoachAttendance")
            .update(payload)
            .eq("id", existing.id);
          saveError = error;
        } else {
          const { error } = await insforge.database
            .from("CoachAttendance")
            .insert(payload);
          saveError = error;
        }

        if (saveError) throw new Error(`${coach.fullName}: ${extractError(saveError)}`);
      }

      setMessage({ type: "success", text: "تم حفظ الحضور بنجاح ✅" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      const errText = err?.message || extractError(err);
      console.error("Coach Attendance Save Failed:", errText);
      setMessage({ type: "error", text: `حدث خطأ: ${errText}` });
    } finally {
      setSaving(false);
    }
  };

  const filteredCoaches = coaches.filter(c => {
    const matchesSport = selectedSport === "all" || c.Sport?.id === selectedSport;
    const matchesSearch = c.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  const stats = {
    total: filteredCoaches.length,
    present: filteredCoaches.filter(c => attendance[c.id] === "present").length,
    absent: filteredCoaches.filter(c => attendance[c.id] === "absent").length,
    others: filteredCoaches.filter(c => attendance[c.id] === "late" || attendance[c.id] === "excused").length,
  };

  const markedCount = filteredCoaches.filter(c => attendance[c.id]).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24" dir="rtl">
      {/* Header Area */}
      <div className="bg-primary text-white p-8 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 py-4">
          <div className="flex items-center gap-5">
            <div className="bg-white/20 p-4 rounded-[22px] backdrop-blur-xl border border-white/30 shadow-inner">
              <CalendarCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">حضور وغياب المدربين</h1>
              <p className="text-white/70 text-sm mt-1 font-medium">تسجيل وتوثيق الحضور اليومي للطاقم التدريبي</p>
            </div>
          </div>
          <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/20 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-white/80" />
            <span className="text-sm font-bold tracking-wide">{new Date().toLocaleDateString('ar-QA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8 relative z-20">
        
        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-7 rounded-[35px] shadow-sm border border-gray-100 flex items-center gap-6 relative overflow-hidden group">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">إجمالي المدربين</p>
              <h3 className="text-4xl font-black text-gray-900 leading-none mt-1">{stats.total}</h3>
              <p className="text-[10px] text-gray-400 mt-2 font-bold px-2 py-0.5 bg-gray-50 rounded-full inline-block">جميع التخصصات</p>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[35px] shadow-sm border border-gray-100 flex items-center gap-6 relative overflow-hidden group border-b-4 border-b-emerald-500">
            <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">حاضر اليوم</p>
              <h3 className="text-4xl font-black text-emerald-600 leading-none mt-1">{stats.present}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] text-emerald-500 font-black">{stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : 0}% نسبة الانضباط</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[35px] shadow-sm border border-gray-100 flex items-center gap-6 relative overflow-hidden group border-b-4 border-b-rose-500">
            <div className="bg-rose-50 p-4 rounded-2xl text-rose-600">
              <XCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">غائب</p>
              <h3 className="text-4xl font-black text-rose-600 leading-none mt-1">{stats.absent}</h3>
              <p className="text-[10px] text-rose-400 mt-2 font-black">يتطلب مراجعة</p>
            </div>
          </div>

          <div className="bg-white p-7 rounded-[35px] shadow-sm border border-gray-100 flex items-center gap-6 relative overflow-hidden group border-b-4 border-b-amber-500">
            <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
              <Clock className="h-8 w-8" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">متأخر / إذن</p>
              <h3 className="text-4xl font-black text-amber-600 leading-none mt-1">{stats.others}</h3>
              <p className="text-[10px] text-amber-500 mt-2 font-black">إشعارات مسجلة</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Date Search */}
            <div className="relative">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block mr-1">تاريخ التحضير</label>
              <div className="relative group">
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pr-14 pl-5 py-5 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[22px] transition-all font-bold text-gray-900 outline-none shadow-inner" 
                />
              </div>
            </div>

            {/* Sport Filter */}
            <div className="relative text-right" dir="rtl">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block mr-1">قسم الرياضة</label>
              <div className="relative group text-right">
                <LayoutGrid className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                <select 
                  value={selectedSport} 
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full pr-14 pl-12 py-5 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[22px] transition-all font-bold text-gray-900 outline-none appearance-none shadow-inner text-right rtl"
                >
                  <option value="all">جميع الرياضات</option>
                  {sports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 pointer-events-none transition-transform group-focus-within:rotate-180" />
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block mr-1">البحث بالاسم</label>
              <div className="relative group text-left underline-offset-4">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن اسم المدرب..."
                  className="w-full pr-14 pl-5 py-5 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[22px] transition-all font-bold text-gray-900 outline-none shadow-inner" 
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button className="px-8 bg-gray-100 text-primary py-4 rounded-[20px] font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-all group">
              <Filter className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
              تحديث
            </button>
            <button 
              onClick={markAllAsPresent}
              className="px-8 bg-emerald-50 text-emerald-600 rounded-[20px] font-black hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5" />
              المتبقي حاضر
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || filteredCoaches.length === 0}
              className="flex-1 px-12 bg-primary text-white py-4 rounded-[20px] font-black flex items-center justify-center gap-2 shadow-lg hover:bg-[#7a1432] disabled:opacity-50 transition-all text-lg"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              <span>حفظ الحضور</span>
            </button>
          </div>
        </div>

        {/* Coach Roster Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-2xl font-black text-gray-900">كشف التحضير</h2>
              <div className="h-1.5 w-12 bg-primary rounded-full mt-1.5"></div>
            </div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest pb-1 border-b-2 border-gray-100">تحضير {filteredCoaches.length} مدرباً</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-400">
                <div className="relative">
                   <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
                   <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#F8F9FA] to-transparent"></div>
                </div>
                <p className="font-black text-lg">جاري مزامنة بيانات المدربين...</p>
              </div>
            ) : filteredCoaches.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-400 bg-white rounded-[40px] border-4 border-dashed border-gray-100">
                <div className="bg-gray-50 p-8 rounded-full mb-6">
                  <User className="h-20 w-20 opacity-10" />
                </div>
                <p className="font-black text-xl">لا يوجد مدربين مطابقين للبحث</p>
                <button onClick={() => {setSearchQuery(""); setSelectedSport("all")}} className="mt-4 text-primary font-bold underline">إعادة تعيين الفلاتر</button>
              </div>
            ) : (
              filteredCoaches.map((coach) => {
                const status = attendance[coach.id];
                return (
                  <div key={coach.id} className={`relative bg-white rounded-[20px] p-5 shadow-[0_2px_15px_rgb(0,0,0,0.05)] border transition-all ${status === 'present' ? 'border-emerald-200' : status === 'absent' ? 'border-rose-200' : status === 'late' ? 'border-amber-200' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#f5f0f2] to-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
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
                                className="w-full h-full object-cover" 
                            />
                          )}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${status === "present" ? "bg-emerald-400" : status === "absent" ? "bg-rose-500" : status === "late" ? "bg-amber-400" : "bg-gray-300"}`} />
                      </div>

                      {/* Name & Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-tertiary text-sm leading-tight truncate">{coach.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-secondary" />
                          {coach.Sport?.name || "مدرب عام الأكاديمية"}
                        </div>
                      </div>
                    </div>

                    {/* Attendance Toggle Buttons */}
                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => status === 'present' ? setAttendance(prev => ({ ...prev, [coach.id]: "" })) : setAttendance(prev => ({ ...prev, [coach.id]: "present" }))}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-[10px] text-[10px] font-black border transition-all ${
                          status === 'present'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        حاضر
                      </button>
                      <button
                        onClick={() => status === 'late' ? setAttendance(prev => ({ ...prev, [coach.id]: "" })) : setAttendance(prev => ({ ...prev, [coach.id]: "late" }))}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-[10px] text-[10px] font-black border transition-all ${
                          status === 'late'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        تأخير
                      </button>
                      <button
                        onClick={() => status === 'absent' ? setAttendance(prev => ({ ...prev, [coach.id]: "" })) : setAttendance(prev => ({ ...prev, [coach.id]: "absent" }))}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-[10px] text-[10px] font-black border transition-all ${
                          status === 'absent'
                            ? 'bg-[#C0392B] text-white border-[#C0392B] shadow-sm'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        غائب
                      </button>
                    </div>

                    {/* Notes Field */}
                    <div className="mt-3 relative group/note">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                        <AlertTriangle className={`h-3 w-3 ${notes[coach.id] ? 'text-amber-500' : 'text-gray-300'}`} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="أضف ملاحظة..."
                        value={notes[coach.id] || ""}
                        onChange={(e) => setNotes(prev => ({ ...prev, [coach.id]: e.target.value }))}
                        className="w-full pr-8 pl-3 py-2 bg-gray-50 border border-gray-200 focus:border-primary/30 rounded-lg text-[11px] font-bold text-gray-700 outline-none placeholder:text-gray-400 transition-colors"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>



      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 px-10 py-5 rounded-[30px] shadow-2xl z-[100] flex items-center gap-4 animate-in fade-in slide-in-from-top-6 focus-in duration-500 font-black border-2 backdrop-blur-xl ${
          message.type === "success" ? "bg-emerald-500/90 text-white border-white/20" : "bg-rose-500/90 text-white border-white/20"
        }`}>
          <div className="bg-white/20 p-2 rounded-xl">
            {message.type === "success" ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
          </div>
          <span className="text-lg">{message.text}</span>
        </div>
      )}
    </div>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
