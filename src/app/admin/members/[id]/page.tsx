"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Edit, Loader2, Phone, Mail, MapPin, Plus, UserCircle, Save, UploadCloud, X, Award, Activity, CreditCard, Printer, Trash2 } from "lucide-react";
import { getMemberById, updateMember, getSports, assignOrUpdateSport, getMemberSequentialNumber, deleteMember } from "@/lib/insforge/queries";
import { insforge } from "@/lib/insforge/client";
import MemberAttachments from "@/app/components/MemberAttachments";

export default function MemberDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [member, setMember] = useState<any>(null);
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [membershipNumber, setMembershipNumber] = useState<number | null>(null);
  
  // Edit Form State
  const [formData, setFormData] = useState({
    fullNameArabic: "", fullNameEnglish: "", phoneFather: "", phoneMother: "",
    notes: "", dateOfBirth: "", nationalId: "", selectedSportId: "", photoUrl: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    async function init() {
      if (!id || typeof id !== "string") return;
      try {
        const [data, sportsData] = await Promise.all([getMemberById(id), getSports()]);
        setMember(data);
        setSports(sportsData || []);
        
        setFormData({
          fullNameArabic: data.fullNameArabic || "",
          fullNameEnglish: data.fullNameEnglish || "",
          phoneFather: data.phoneFather || "",
          phoneMother: data.phoneMother || "",
          notes: data.notes || "",
          dateOfBirth: data.dateOfBirth || "",
          nationalId: data.nationalId || "",
          photoUrl: data.photoUrl || "",
          selectedSportId: data.SportsEnrollment?.[0]?.sportId || ""
        });

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
    init();
  }, [id]);

  const handleDeleteMember = async () => {
    if (window.confirm("تحذير: هل أنت متأكد من حذف هذا العضو؟ سيتم حذف كافة الاشتراكات، السجلات، والمدفوعات المتعلقة به نهائياً ولا يمكن التراجع عن هذا الإجراء.")) {
      try {
        setSaving(true);
        await deleteMember(id as string);
        router.push('/admin/members');
      } catch (err: any) {
        console.error("Delete Error", err);
        alert("حدث خطأ أثناء الحذف: " + (err?.message || ""));
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || typeof id !== "string") return;
    setSaving(true);
    try {
      // Exclude selectedSportId - it's a UI-only field, not a DB column
      const { selectedSportId, ...memberFields } = formData;

      // Convert empty string date fields to null to avoid Postgres type errors
      const sanitizedFields = {
        ...memberFields,
        dateOfBirth: memberFields.dateOfBirth?.trim() || null,
      };

      await updateMember(id, sanitizedFields);

      // Only update sport if it was actually changed
      const originalSportId = member?.SportsEnrollment?.[0]?.sportId || "";
      if (selectedSportId && selectedSportId !== originalSportId) {
        await assignOrUpdateSport(id, selectedSportId);
      }

      const updatedData = await getMemberById(id);
      setMember(updatedData);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error("handleSave error:", err);
      alert("حدث خطأ أثناء حفظ التعديلات:\n" + (err?.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !id || typeof id !== "string") return;
    const file = e.target.files[0];
    setUploadingPhoto(true);
    
    // Create local preview URL immediately so it displays right away
    const localPreviewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, photoUrl: localPreviewUrl }));
    
    try {
      const extension = file.name.split('.').pop();
      const storageKey = `profiles/${id}-${Date.now()}.${extension}`;
      const { data: uploadData, error: uploadError } = await insforge.storage
        .from("members-docs")
        .upload(storageKey, file);
      if (uploadError) {
        const msg = (uploadError as any)?.message || "";
        if (msg.includes("404") || msg.includes("not found") || msg.includes("Bucket")) {
          alert("تعذر رفع الصورة: مساحة التخزين (members-docs) غير مُنشأة.\nيرجى تشغيل: npx @insforge/cli storage create-bucket members-docs");
        } else {
          alert("تعذر رفع الصورة: " + msg);
        }
        // Revert preview on error
        setFormData(prev => ({ ...prev, photoUrl: member?.photoUrl || "" }));
        return;
      }
      if (!uploadData) throw new Error("No upload data returned");
      
      const actualPath = (uploadData as any).path || uploadData.key || storageKey;
      
      // Get the correct public URL from the SDK
      const remoteUrl = insforge.storage.from("members-docs").getPublicUrl(actualPath);
      
      console.log("Photo uploaded", remoteUrl);
      await updateMember(id, { photoUrl: remoteUrl });
      setMember((prev: any) => prev ? { ...prev, photoUrl: remoteUrl } : prev);
      setFormData(prev => ({ ...prev, photoUrl: remoteUrl }));
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      alert("حدث خطأ: " + (err?.message || JSON.stringify(err)));
      setFormData(prev => ({ ...prev, photoUrl: member?.photoUrl || "" }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#8A1538]" /></div>;
  if (!member) return <div className="text-center mt-20 text-[#8A1538] font-bold">لم يتم العثور على بيانات العضو</div>;

  // Mocked/Computed metrics
  const joinedDate = new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const beltTestsCount = member.BeltTest?.length || 0;
  const certificatesCount = beltTestsCount; 
  const activeSubscription = member.SportsEnrollment?.find((s:any) => s.status === 'active') || member.SportsEnrollment?.[0];
  const primarySportName = activeSubscription?.Sport?.name || "بدون اشتراك نشط";
  
  let daysRemaining = 0;
  let subStart = "-";
  let subEnd = "-";
  if (activeSubscription?.subscriptionEnd) {
     const end = new Date(activeSubscription.subscriptionEnd);
     const start = new Date(activeSubscription.subscriptionStart || new Date());
     subStart = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
     subEnd = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
     daysRemaining = Math.max(0, Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
  }

  // Attendance metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthAttendance = member.Attendance?.filter((a: any) => {
    const d = new Date(a.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }) || [];
  const presentCount = thisMonthAttendance.filter((a: any) => a.status === 'present').length;
  const totalRecordedCount = thisMonthAttendance.length;
  const attendancePercentage = totalRecordedCount > 0 ? Math.round((presentCount / totalRecordedCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 font-sans mt-4 relative">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.push('/admin/members')} className="p-2 text-[#8A1538] hover:bg-white/50 rounded-full transition-colors flex items-center justify-center">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h1 className="text-[#5A0B1A] font-extrabold text-[15px] tracking-wide font-almarai">
          الملف الشخصي
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-[#8A1538] hover:bg-white/50 rounded-full transition-colors flex items-center justify-center" title="تعديل">
            <Edit className="w-5 h-5" />
          </button>
          <button onClick={handleDeleteMember} disabled={saving} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center" title="حذف العضو">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        
        {/* === MAIN COLUMN (LEFT) === */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Profile Card */}
          <div className="bg-white rounded-[24px] pt-14 pb-8 px-6 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-12 flex flex-col items-center border border-[#8A1538]/10 hover:border-[#8A1538]/30 transition-all">
            {/* Floating Avatar */}
            <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 rounded-[20px] overflow-hidden border-4 border-[#F5F5F7] shadow-lg bg-gray-50 h-[104px] w-[104px] flex items-center justify-center">
              {(formData.photoUrl || member?.photoUrl) ? (
                <img src={formData.photoUrl || member?.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-14 h-14 text-gray-300" />
              )}
            </div>

            <h2 className="text-[#5A0B1A] text-2xl font-black text-center mb-2 leading-tight font-almarai">
              {member.fullNameArabic || member.fullNameEnglish}
            </h2>
            
            <div className="bg-[#fcecc2] text-[#bc8c20] px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest mb-5">
              عضو نشط
            </div>

            <div className="text-[#5A0B1A] font-bold text-[13px] mb-4 flex items-center gap-2">
              رقم العضوية: <span className="font-extrabold" dir="ltr">{membershipNumber ? `10${membershipNumber}` : "...."}</span>
              <button 
                onClick={() => router.push(`/admin/members/${id}/card`)}
                className="p-1.5 bg-[#8A1538]/5 text-[#8A1538] rounded-md hover:bg-[#8A1538]/10 transition-colors"
                title="عرض بطاقة العضوية"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-3 w-full justify-center">
              <div className="bg-[#f5f5f7] px-3 py-2 rounded-xl text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                <span className="text-[#8A1538]">📅</span>
                انضم في {joinedDate}
              </div>
              <div className="bg-[#f5f5f7] px-3 py-2 rounded-xl text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                <span className="text-yellow-600">⭐</span>
                باقة ذهبية
              </div>
            </div>
          </div>

          {/* Performance Score Card */}
          <div className="bg-[#5A0B1A] rounded-[24px] p-7 text-white relative overflow-hidden shadow-lg border border-[#8A1538]/20">
            <div className="absolute -bottom-8 -right-8 opacity-10">
              <Award className="w-56 h-56" />
            </div>
            
            <h3 className="text-[10px] font-bold tracking-widest mb-4 text-white/70">مؤشر الأداء</h3>
            <div className="flex items-end gap-3 mb-6 relative z-10">
              <span className="text-6xl font-black leading-none tracking-tighter" dir="ltr">{attendancePercentage}%</span>
              <span className="text-[#c19951] font-bold mb-1.5 text-xs flex items-center" dir="ltr">معدل الانضبط</span>
            </div>

            <div className="space-y-2 mb-8 relative z-10 w-[85%] lg:w-[60%]">
              <div className="flex justify-between text-[11px] font-medium text-white/80">
                <span>الحضور الشهري</span>
                <span className="font-bold">{presentCount}/{totalRecordedCount || 0} يوم</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#a3803f] w-[93%] rounded-full shadow-[0_0_10px_rgba(163,128,63,0.8)]"></div>
              </div>
            </div>

            <div className="flex gap-8 relative z-10">
              <div>
                <div className="text-2xl font-black border-b border-white/20 pb-1 mb-1">12</div>
                <div className="text-[10px] tracking-wide font-bold text-white/50">ميدالية</div>
              </div>
              <div>
                <div className="text-2xl font-black border-b border-white/20 pb-1 mb-1">{certificatesCount.toString().padStart(2, '0')}</div>
                <div className="text-[10px] tracking-wide font-bold text-white/50">شهادة</div>
              </div>
            </div>
          </div>

          {/* Active Programs */}
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#8A1538]/10 px-6 py-7">
            <h3 className="text-[#5A0B1A] font-black text-[13px] mb-6 flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-[#8A1538]" />
              البرامج النشطة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {member.SportsEnrollment?.map((en:any) => (
                <div key={en.id} className="bg-[#fcfaf6] rounded-[16px] p-4 flex items-center justify-between hover:bg-[#f8f5f0] transition-colors border border-transparent hover:border-[#8A1538]/10 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#f4ecee] flex items-center justify-center shrink-0">
                      <span className="text-lg">🥋</span>
                    </div>
                    <div>
                      <div className="font-black text-[#5A0B1A] text-sm mb-0.5">{en.Sport?.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold">أساسي</div>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-300 transform rotate-180" />
                </div>
              ))}
              {(!member.SportsEnrollment || member.SportsEnrollment.length === 0) && (
                <div className="col-span-full text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  لا توجد رياضات مسجلة حالياً
                </div>
              )}
            </div>
            <button className="w-full border-2 border-dashed border-[#eadbdf] text-[#a39498] rounded-[16px] py-4 flex items-center justify-center gap-2 font-bold hover:bg-[#fcfaf6] hover:text-[#8A1538] hover:border-[#8A1538]/30 transition-all text-[11px] tracking-widest">
              <Plus className="w-3 h-3" />
              التسجيل في رياضة جديدة
            </button>
          </div>
        </div>

        {/* === SIDEBAR COLUMN (RIGHT) === */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Contact Information */}
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#8A1538]/10 px-6 py-7">
            <h3 className="text-[#5A0B1A] font-black text-[13px] mb-6 flex items-center gap-2.5">
              <UserCircle className="w-4 h-4 text-[#8A1538]" />
              بيانات التواصل
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#fcfaf6] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#8A1538]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold tracking-widest text-[#a39498] mb-0.5 uppercase">رقم الهاتف</div>
                  <div className="font-bold text-[#5A0B1A] text-sm" dir="ltr">{member.phoneFather || member.phoneMother || "لا يوجد رقم"}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#fcfaf6] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#8A1538]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold tracking-widest text-[#a39498] mb-0.5 uppercase">البريد الإلكتروني</div>
                  <div className="font-bold text-[#5A0B1A] text-sm" dir="ltr">{member.nationalId ? `member.${member.nationalId.substring(0,4)}@example.qa` : "لا يوجد بريد"}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#fcfaf6] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#8A1538]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold tracking-widest text-[#a39498] mb-0.5 uppercase">مكان الإقامة</div>
                  <div className="font-bold text-[#5A0B1A] text-sm">{member.notes ? member.notes.substring(0, 30) : "الدوحة، قطر"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#8A1538]/10 px-6 py-7">
            <h3 className="text-[#5A0B1A] font-black text-[13px] mb-6 flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-[#8A1538]" />
              تفاصيل الاشتراك
            </h3>
            <div className="bg-[#fcfaf6] rounded-[16px] p-5 mb-5 box-border w-full">
              <div className="text-[9px] font-bold tracking-widest text-[#a39498] mb-1.5 uppercase">الخطة الحالية</div>
              <div className="flex justify-between items-center w-full">
                <div className="text-[#5A0B1A] font-black text-lg truncate max-w-[70%]">{primarySportName}</div>
                <div className="text-[#bc8c20] text-[10px] font-black tracking-widest bg-[#fcecc2] px-3 py-1 rounded-full">ذهبي</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 px-1">
              <div>
                <div className="text-[9px] font-bold tracking-widest text-[#a39498] mb-1 uppercase">تاريخ البدء</div>
                <div className="font-extrabold text-[#111] text-xs">{subStart}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-widest text-[#a39498] mb-1 uppercase">تاريخ الانتهاء</div>
                <div className="font-extrabold text-[#111] text-xs">{subEnd}</div>
              </div>
            </div>
            <div className="bg-[#f2ead0]/60 rounded-xl flex items-center justify-between p-4 px-5">
              <span className="text-[#98752c] text-[10px] tracking-widest font-bold">المتبقي</span>
              <span className="text-[#98752c] font-black text-sm">{daysRemaining} أيام</span>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#8A1538]/10 overflow-hidden">
            <MemberAttachments memberId={member.id} />
          </div>
        </div>

      </div>


      {/* Mobile-Style Bottom Navigation */}
      {/* (Omitted for now as admin panel has sidebar, but standard element added if needed) */}

      {/* --- Editing Modal --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#fcfaf6]">
               <h3 className="text-lg font-bold text-[#8A1538]">تعديل بيانات العضو</h3>
               <button onClick={() => setIsEditModalOpen(false)} className="bg-gray-100 p-2 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                 <X className="h-5 w-5" />
               </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              
               <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="relative group w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-[#8A1538]/30 shadow-inner shrink-0 leading-none">
                  {(formData.photoUrl || member?.photoUrl) ? (
                    <img src={formData.photoUrl || member?.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-full h-full text-gray-300" />
                  )}
                    <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="w-5 h-5 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                    {uploadingPhoto && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#8A1538]" /></div>}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">اضغط على الصورة لتعديلها</div>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">الاسم بالعربية</label>
                    <input type="text" value={formData.fullNameArabic} onChange={e => setFormData({...formData, fullNameArabic: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">الاسم بالإنجليزية</label>
                    <input type="text" value={formData.fullNameEnglish} onChange={e => setFormData({...formData, fullNameEnglish: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-left min-w-0" dir="ltr" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">هاتف الأب</label>
                      <input type="tel" value={formData.phoneFather} onChange={e => setFormData({...formData, phoneFather: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-left min-w-0" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">هاتف الأم</label>
                      <input type="tel" value={formData.phoneMother} onChange={e => setFormData({...formData, phoneMother: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-left min-w-0" dir="ltr" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">تاريخ الميلاد</label>
                      <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">الرقم الشخصي / ID</label>
                      <input type="text" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-left min-w-0" dir="ltr" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">الرياضة الأساسية</label>
                    <select value={formData.selectedSportId} onChange={e => setFormData({...formData, selectedSportId: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none bg-white">
                      <option value="">-- اختر نوع الرياضة --</option>
                      {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">ملاحظات / سكن</label>
                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none resize-none" placeholder="اكتب ملاحظات طبية أو معلومات عن السكن..." />
                  </div>
               </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-[#fdfaf6] flex gap-3">
               <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#8A1538] hover:bg-[#5A0B1A] text-white py-3.5 rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2">
                 {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                 حفظ التغييرات
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
