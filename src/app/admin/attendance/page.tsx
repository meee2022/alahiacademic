"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, CalendarDays, Save, BarChart3, X, Eye, Users, Trophy } from "lucide-react";
import { getSports, getMembers, MemberWithEnrollments, markAttendance, getAttendanceByDateAndSport } from "@/lib/insforge/queries";
import { insforge } from "@/lib/insforge/client";

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedSportName, setSelectedSportName] = useState("");
  const [sports, setSports] = useState<{id: string, name: string}[]>([]);
  const [students, setStudents] = useState<(MemberWithEnrollments & { present?: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searched, setSearched] = useState(false);

  // Report states
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<{memberId: string, name: string, present: number, absent: number, total: number}[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Detail modal
  const [detailModal, setDetailModal] = useState(false);
  const [detailName, setDetailName] = useState("");
  const [detailRecords, setDetailRecords] = useState<{date: string, status: string}[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getSports().then(data => setSports(data as any));
  }, []);

  useEffect(() => {
    if (selectedSport && date) {
      fetchList();
    }
  }, [selectedSport, date]);

  const fetchList = async () => {
    if (!selectedSport || !date) return;
    setLoading(true);
    setSearched(true);
    try {
      // Query members who have an enrollment in the selected sport using an inner join filter
      const { data: enrolledMembers, error: enrollErr } = await insforge.database
        .from("Member")
        .select("*, SportsEnrollment!inner(*, Sport(*))")
        .eq("SportsEnrollment.sportId", selectedSport);

      if (enrollErr) {
        console.error("Error fetching enrolled members:", enrollErr);
        throw enrollErr;
      }

      const enrolled = enrolledMembers || [];
      console.log(`Found ${enrolled.length} members for sport ${selectedSport}`);

      const attendance = await getAttendanceByDateAndSport(date, selectedSport);
      const studentList = enrolled.map((s: any) => ({
        ...s,
        present: attendance.some(a => a.memberId === s.id && a.status === "present")
      }));

      setStudents(studentList);
      const sport = sports.find(s => s.id === selectedSport);
      setSelectedSportName(sport?.name || "");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء تحميل القائمة");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, present: !s.present } : s));
  };

  const markAllAsPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, present: true })));
  };

  const handleSave = async () => {
    if (!selectedSport || !date) return;
    setSaving(true);
    try {
      await Promise.all(students.map(s =>
        markAttendance(s.id, selectedSport, date, s.present ? "present" : "absent")
      ));
      alert("تم حفظ سجل الحضور بنجاح ✓");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(s => s.present).length;
  const absentCount = students.length - presentCount;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const fetchReport = async () => {
    if (!selectedSport) { alert("يرجى اختيار الرياضة أولاً"); return; }
    setReportLoading(true);
    setShowReport(true);
    try {
      const allMembers = await getMembers();
      const enrolled = allMembers.filter(m =>
        m.SportsEnrollment && m.SportsEnrollment.some(en => en.sportId === selectedSport)
      );
      const { data: attendanceData } = await insforge.database
        .from("Attendance").select("memberId, status")
        .eq("sportId", selectedSport).gte("date", dateFrom).lte("date", dateTo);

      const summary = enrolled.map(m => {
        const records = (attendanceData || []).filter((a: any) => a.memberId === m.id);
        const present = records.filter((a: any) => a.status === "present").length;
        const absent = records.filter((a: any) => a.status === "absent").length;
        return { memberId: m.id, name: m.fullNameArabic, present, absent, total: present + absent };
      }).sort((a, b) => {
        const rateA = a.total > 0 ? a.present / a.total : 0;
        const rateB = b.total > 0 ? b.present / b.total : 0;
        return rateB - rateA;
      });
      setReportData(summary);
    } catch (err) { console.error(err); } finally { setReportLoading(false); }
  };

  const openMemberDetail = async (memberId: string, name: string) => {
    setDetailName(name); setDetailModal(true); setDetailLoading(true);
    try {
      const { data } = await insforge.database.from("Attendance").select("date, status")
        .eq("memberId", memberId).eq("sportId", selectedSport)
        .gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false });
      setDetailRecords((data as {date: string, status: string}[]) || []);
    } catch (err) { console.error(err); } finally { setDetailLoading(false); }
  };

  return (
    <div className="space-y-7">

      {/* === PAGE HEADER === */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#8A1538] flex items-center gap-3">
            <CalendarDays className="w-7 h-7" />
            تسجيل الحضور
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">إدارة الحضور اليومي للاعبين والأطقم</p>
        </div>
        {students.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#8A1538] hover:bg-[#5A0B1A] text-white px-6 py-3 rounded-full flex items-center gap-2 font-bold transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            حفظ الحضور
          </button>
        )}
      </div>

      {/* === SELECTION CARDS ROW === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Date Card */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-2">التاريخ</div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full text-[#5A0B1A] font-black text-lg bg-transparent border-none outline-none"
          />
        </div>

        {/* Sport Card */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-2">الرياضة</div>
          <select
            value={selectedSport}
            onChange={e => { setSelectedSport(e.target.value); setSelectedSportName(sports.find(s => s.id === e.target.value)?.name || ""); }}
            className="w-full text-[#5A0B1A] font-black text-lg bg-transparent border-none outline-none"
          >
            <option value="">اختر الرياضة</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Members Count Card */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-1">عدد المسجلين</div>
            <div className="text-[#5A0B1A] font-black text-2xl">{students.length} <span className="text-lg font-bold text-gray-400">لاعباً</span></div>
          </div>
          <div className="w-14 h-14 rounded-[14px] bg-[#f5f0f2] flex items-center justify-center">
            <Users className="w-7 h-7 text-[#8A1538]" />
          </div>
        </div>
      </div>

      {/* Load Button */}
      {!searched || students.length === 0 ? (
        <button
          onClick={fetchList}
          disabled={loading || !selectedSport}
          className="w-full bg-[#8A1538] hover:bg-[#5A0B1A] text-white py-4 rounded-[16px] font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          عرض قائمة الحضور
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={fetchList}
            disabled={loading}
            className="text-[#8A1538] text-sm font-bold border border-[#8A1538]/30 hover:bg-[#8A1538]/5 rounded-full px-5 py-2 transition-all"
          >
            تحديث القائمة
          </button>
          <button
            onClick={markAllAsPresent}
            disabled={loading}
            className="text-emerald-600 text-sm font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-full px-5 py-2 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            تحضير الجميع (حاضر)
          </button>
        </div>
      )}

      {/* === MEMBER CARDS GRID === */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-10 w-10 animate-spin text-[#8A1538]" /></div>
      ) : searched && students.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student, idx) => (
            <div key={student.id} className={`relative bg-white rounded-[20px] p-5 shadow-[0_2px_15px_rgb(0,0,0,0.05)] border transition-all ${student.present ? 'border-emerald-200' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#f5f0f2] to-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {(student as any).photoUrl ? (
                      <img src={(student as any).photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-[#8A1538]/30">{student.fullNameArabic.charAt(0)}</span>
                    )}
                  </div>
                  <span className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-white ${student.present ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                </div>

                {/* Name & Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[#5A0B1A] text-sm leading-tight truncate">{student.fullNameArabic}</div>
                  <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                    {student.SportsEnrollment?.find(e => e.sportId === selectedSport)?.Sport?.name || selectedSportName} · رقم {idx + 1}
                  </div>
                </div>
              </div>

              {/* Attendance Toggle Buttons */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => student.present ? toggleStatus(student.id) : null}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[11px] font-black border transition-all ${
                    !student.present
                      ? 'bg-[#8A1538] text-white border-[#8A1538] shadow-md shadow-[#8A1538]/20'
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  غائب
                </button>
                <button
                  onClick={() => !student.present ? toggleStatus(student.id) : null}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[11px] font-black border transition-all ${
                    student.present
                      ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-md shadow-[#C5A059]/20'
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  حاضر
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : searched && students.length === 0 && !loading ? (
        <div className="py-16 text-center text-gray-400 text-sm font-medium">لا يوجد لاعبون مسجلون في هذه الرياضة</div>
      ) : null}

      {/* === PERFORMANCE SECTION === */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Performance Card */}
          <div className="bg-[#5A0B1A] rounded-[24px] p-7 text-white relative overflow-hidden col-span-1">
            <div className="absolute -bottom-6 -right-6 text-[120px] font-black text-white/5 leading-none select-none">%</div>
            <div className="text-[10px] font-bold tracking-widest mb-4 text-white/60">نسبة الحضور</div>
            <div className="text-5xl font-black mb-5">{attendanceRate}%</div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C5A059] rounded-full transition-all"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
            <div className="mt-4 text-white/60 text-xs font-medium">{presentCount} حاضر · {absentCount} غائب</div>
          </div>

          {/* Summary Stats */}
          <div className="col-span-2 grid grid-cols-2 gap-5">
            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-5">
              <div className="w-14 h-14 rounded-[14px] bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-1">إجمالي الحضور</div>
                <div className="text-3xl font-black text-[#5A0B1A]">{presentCount}</div>
              </div>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-5">
              <div className="w-14 h-14 rounded-[14px] bg-rose-50 flex items-center justify-center shrink-0">
                <XCircle className="w-7 h-7 text-rose-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-1">إجمالي الغياب</div>
                <div className="text-3xl font-black text-[#5A0B1A]">{absentCount}</div>
              </div>
            </div>

            {/* Date range for report */}
            <div className="col-span-2 bg-white rounded-[20px] p-5 shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-bold text-gray-700">من</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-800 outline-none" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-bold text-gray-700">إلى</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-800 outline-none" />
              </div>
              <button onClick={fetchReport} disabled={reportLoading || !selectedSport}
                className="bg-[#8A1538] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-[#5A0B1A] transition-all disabled:opacity-50 flex items-center gap-1.5">
                {reportLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                <BarChart3 className="h-3.5 w-3.5" />
                عرض تقارير الحضور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === DISCIPLINE LEADERBOARD === */}
      {showReport && (
        <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#5A0B1A] font-black text-base flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-[#C5A059]" />
              سجل انضباط اللاعبين
            </h2>
            <button onClick={() => setShowReport(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {reportLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-[#8A1538]" /></div>
          ) : reportData.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">لا يوجد بيانات في هذه الفترة</p>
          ) : (
            <div className="space-y-3">
              {reportData.map((r, idx) => {
                const rate = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
                return (
                  <div key={r.memberId} className="flex items-center gap-4 p-4 bg-[#fcfaf6] rounded-[16px] hover:bg-[#f8f5f0] transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#f5f0f2] flex items-center justify-center shrink-0 font-black text-[#8A1538] text-sm">
                      {r.name.charAt(0)}
                    </div>

                    {/* Name & Team */}
                    <div className="flex-1 min-w-0">
                      <button onClick={() => openMemberDetail(r.memberId, r.name)}
                        className="font-extrabold text-[#5A0B1A] text-sm hover:text-[#8A1538] transition-colors flex items-center gap-1.5 mb-0.5">
                        <Eye className="w-3.5 h-3.5" />
                        {r.name}
                      </button>
                      <div className="text-[10px] text-gray-400 font-bold">{r.present}/{r.total} جلسات</div>
                    </div>

                    {/* Progress bar */}
                    <div className="hidden sm:block w-40">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                        <span>معدل الالتزام</span>
                        <span className={rate >= 75 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-500' : 'text-rose-500'}>{rate}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${rate >= 75 ? 'bg-[#C5A059]' : rate >= 50 ? 'bg-amber-400' : 'bg-[#8A1538]'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>

                    {/* Sessions small badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${rate >= 75 ? 'bg-emerald-50 text-emerald-600' : rate >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                      {rate}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === Member Attendance Detail Modal === */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-black text-[#8A1538]">سجل حضور: {detailName}</h2>
              <button onClick={() => setDetailModal(false)} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 text-xs text-gray-400 border-b border-gray-50 font-medium">
              الفترة: {dateFrom} ← {dateTo}
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2 modal-content-safe">
              {detailLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#8A1538]" /></div>
              ) : detailRecords.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">لا توجد سجلات في هذه الفترة</p>
              ) : (
                detailRecords.map((rec, i) => (
                  <div key={i} className="flex justify-between items-center p-3.5 rounded-xl border border-gray-100 bg-[#fcfaf6]">
                    <span className="text-sm font-bold text-gray-700">
                      {new Date(rec.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${rec.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                      {rec.status === 'present' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {rec.status === 'present' ? 'حاضر' : 'غائب'}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400 font-medium">
              حاضر: {detailRecords.filter(r => r.status === 'present').length} · غائب: {detailRecords.filter(r => r.status === 'absent').length}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
