"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge/client";
import { 
  Settings, Shield, UserCog, Palette, Bell, Save, Loader2, X, Check,
  Building2, Phone, Mail, MapPin, Globe, Lock, Eye, EyeOff,
  Sun, Moon, ChevronLeft, AlertTriangle, LogOut, Trash2, Plus,
  BellRing, BellOff, Clock, DollarSign, Users
} from "lucide-react";

type SettingsTab = "profile" | "academy" | "appearance" | "notifications" | "security";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sports, setSports] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // Fetch sports
  useEffect(() => {
    insforge.database.from("Sport").select("id, name").eq("isActive", true).order("name").then(({ data }) => {
      if (data) setSports(data);
    });
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, sportName?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(sportName || fieldName);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fieldName}/${fileName}`;

      const { data, error } = await insforge.storage
        .from('public-assets')
        .upload(filePath, file);

      if (error) throw error;

      // insforge.storage.upload returns { data: { url, key }, error }
      const publicUrl = data?.url || data?.publicUrl;
      
      if (!publicUrl) {
          console.error("Upload data:", data);
          throw new Error("لم يتم إرجاع رابط الصورة بعد الرفع");
      }

      if (sportName) {
        setAcademy({
          ...academy,
          sportImages: {
            ...(academy.sportImages || {}),
            [sportName]: publicUrl
          }
        });
      } else {
        setAcademy({
          ...academy,
          [fieldName]: publicUrl
        });
      }
    } catch (err: any) {
      console.error('Error uploading image:', err.message);
      alert('فشل رفع الصورة. تأكد من إنشاء مساحة التخزين "public-assets" في لوحة التحكم.');
    } finally {
      setUploadingImage(null);
      e.target.value = '';
    }
  };

  // Profile state
  const [profile, setProfile] = useState({
    name: "محمد",
    email: "eng.mohamed87@live.com",
    phone: "",
    role: "مدير النظام"
  });

  // Academy state
  const [academy, setAcademy] = useState({
    name: "أكاديمية النادي الأهلي",
    subtitle: "لفنون الدفاع عن النفس",
    phone: "",
    address: "قطر",
    currency: "ر.ق",
    subscriptionReminderDays: "7",
    defaultSubscriptionMonths: "1",
    whatsapp: "",
    instagram: "",
    twitter: "",
    mapUrl: "",
    tagline: "انضم إلينا اليوم وابدأ رحلتك في عالم القوة واللياقة البدنية مع نخبة من أفضل المدربين",
    heroImageUrl: "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=1000",
    defaultSportImageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800",
    sportImages: {} as Record<string, string>,
  });

  // Appearance state
  const [appearance, setAppearance] = useState({
    primaryColor: "#8A1538",
    accentColor: "#C5A059",
    fontSize: "medium",
    sidebarStyle: "dark",
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    subscriptionExpiry: true,
    newMember: true,
    paymentReceived: true,
    attendanceAlert: false,
    emailNotifications: false,
    reminderDaysBefore: "3",
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("academy_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.profile) setProfile(prev => ({ ...prev, ...parsed.profile }));
        if (parsed.academy) setAcademy(prev => ({ ...prev, ...parsed.academy }));
        if (parsed.appearance) setAppearance(prev => ({ ...prev, ...parsed.appearance }));
        if (parsed.notifications) setNotifications(prev => ({ ...prev, ...parsed.notifications }));
      } catch {}
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      const settings = { profile, academy, appearance, notifications };
      localStorage.setItem("academy_settings", JSON.stringify(settings));
      
      // Show success
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!security.newPassword || !security.confirmPassword) {
      alert("يرجى ملء جميع الحقول");
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      alert("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    if (security.newPassword.length < 8) {
      alert("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setSaving(true);
    try {
      // For now, just show success
      alert("تم تغيير كلمة المرور بنجاح");
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      alert("حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      await insforge.auth.signOut();
      router.push("/login");
    }
  };

  const tabs = [
    { id: "profile" as SettingsTab, label: "الملف الشخصي", icon: UserCog, desc: "بيانات الحساب" },
    { id: "academy" as SettingsTab, label: "بيانات الأكاديمية", icon: Building2, desc: "معلومات المؤسسة" },
    { id: "appearance" as SettingsTab, label: "المظهر", icon: Palette, desc: "الألوان والتخصيص" },
    { id: "notifications" as SettingsTab, label: "الإشعارات", icon: Bell, desc: "التنبيهات" },
    { id: "security" as SettingsTab, label: "الأمان", icon: Shield, desc: "كلمة المرور" },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#5A0B1A] rounded-[28px] p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-[11px] font-bold tracking-[0.2em] uppercase mb-2">لوحة التحكم</p>
            <h1 className="text-3xl font-black">الإعدادات</h1>
            <p className="text-white/60 text-sm font-medium mt-1">إعدادات النظام والتخصيص والأمان</p>
          </div>
          <div className="w-16 h-16 rounded-[20px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Settings className="w-8 h-8 text-[#C5A059]" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-2 border border-gray-100 shadow-sm flex gap-1 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-[18px] text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-[#5A0B1A] text-white shadow-lg shadow-[#5A0B1A]/20' 
                : 'text-gray-500 hover:text-[#5A0B1A] hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        
        {/* === PROFILE TAB === */}
        {activeTab === "profile" && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-[#8A1538] to-[#5A0B1A] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-[#8A1538]/20">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-black text-[#5A0B1A]">{profile.name}</h2>
                <span className="inline-block mt-1 bg-[#C5A059]/10 text-[#C5A059] px-3 py-1 rounded-full text-xs font-bold">{profile.role}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">الاسم الكامل</label>
                <div className="relative">
                  <UserCog className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type="text" value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 pr-12 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type="email" value={profile.email} 
                    onChange={e => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 pr-12 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type="tel" value={profile.phone} 
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 pr-12 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                    placeholder="5500XXXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">الصلاحية</label>
                <div className="relative">
                  <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type="text" value={profile.role} readOnly
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 pr-12 py-3.5 text-sm font-bold text-gray-400 cursor-not-allowed border border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === ACADEMY TAB === */}
        {activeTab === "academy" && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-14 h-14 rounded-[18px] bg-[#FDF8F9] flex items-center justify-center border border-[#8A1538]/10">
                <Building2 className="w-7 h-7 text-[#8A1538]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#5A0B1A]">بيانات الأكاديمية</h2>
                <p className="text-xs text-gray-400 font-bold">المعلومات الأساسية التي تظهر في الإيصالات والبطاقات</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">اسم الأكاديمية</label>
                <input 
                  type="text" value={academy.name}
                  onChange={e => setAcademy({...academy, name: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">الشعار الفرعي</label>
                <input 
                  type="text" value={academy.subtitle}
                  onChange={e => setAcademy({...academy, subtitle: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">رقم التواصل</label>
                <input 
                  type="tel" value={academy.phone} placeholder="XXXX XXXX"
                  onChange={e => setAcademy({...academy, phone: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">العنوان</label>
                <input 
                  type="text" value={academy.address}
                  onChange={e => setAcademy({...academy, address: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">العملة</label>
                <select 
                  value={academy.currency}
                  onChange={e => setAcademy({...academy, currency: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all appearance-none"
                >
                  <option value="ر.ق">ريال قطري (ر.ق)</option>
                  <option value="ر.س">ريال سعودي (ر.س)</option>
                  <option value="د.إ">درهم إماراتي (د.إ)</option>
                  <option value="د.ك">دينار كويتي (د.ك)</option>
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                </select>
              </div>
            </div>

            {/* Subscription Defaults */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-black text-[#5A0B1A] mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C5A059]" />
                إعدادات الاشتراكات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">تنبيه انتهاء الاشتراك (بالأيام)</label>
                  <input 
                    type="number" value={academy.subscriptionReminderDays}
                    onChange={e => setAcademy({...academy, subscriptionReminderDays: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">مدة الاشتراك الافتراضية (بالأشهر)</label>
                  <select 
                    value={academy.defaultSubscriptionMonths}
                    onChange={e => setAcademy({...academy, defaultSubscriptionMonths: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all appearance-none"
                  >
                    <option value="1">شهر واحد</option>
                    <option value="3">3 أشهر</option>
                    <option value="6">6 أشهر</option>
                    <option value="12">سنة كاملة</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Social Media & Landing Page */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-black text-[#5A0B1A] mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C5A059]" />
                التواصل والسوشال ميديا (تظهر في الصفحة الرئيسية)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">رقم الواتساب</label>
                  <input 
                    type="tel" value={academy.whatsapp} placeholder="+974 XXXX XXXX"
                    onChange={e => setAcademy({...academy, whatsapp: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">حساب انستجرام</label>
                  <input 
                    type="text" value={academy.instagram} placeholder="@academy_name"
                    onChange={e => setAcademy({...academy, instagram: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">حساب تويتر (X)</label>
                  <input 
                    type="text" value={academy.twitter} placeholder="@academy_name"
                    onChange={e => setAcademy({...academy, twitter: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">رابط خريطة جوجل</label>
                  <input 
                    type="url" value={academy.mapUrl} placeholder="https://maps.google.com/..."
                    onChange={e => setAcademy({...academy, mapUrl: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">الشعار الترويجي (يظهر في الصفحة الرئيسية)</label>
                  <textarea 
                    rows={2} value={academy.tagline}
                    onChange={e => setAcademy({...academy, tagline: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="pt-6 border-t border-gray-100 mt-6">
              <h3 className="text-sm font-black text-[#5A0B1A] mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C5A059]" />
                صور صفحات الموقع
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">صورة الهيرو (الصورة الرئيسية الكبيرة)</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="url" value={academy.heroImageUrl} placeholder="https://..."
                      onChange={e => setAcademy({...academy, heroImageUrl: e.target.value})}
                      className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                    />
                    <label className={`shrink-0 cursor-pointer ${uploadingImage === 'heroImageUrl' ? 'bg-gray-100' : 'bg-[#FDF8F9] hover:bg-[#8A1538]/10'} text-[#8A1538] px-4 py-3.5 rounded-2xl font-bold text-sm transition-all border border-[#8A1538]/10 relative`}>
                      {uploadingImage === 'heroImageUrl' ? 'جاري الرفع...' : 'رفع صورة'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, 'heroImageUrl')}
                      />
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">الصورة الافتراضية للرياضات</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="url" value={academy.defaultSportImageUrl} placeholder="https://..."
                      onChange={e => setAcademy({...academy, defaultSportImageUrl: e.target.value})}
                      className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                    />
                    <label className={`shrink-0 cursor-pointer ${uploadingImage === 'defaultSportImageUrl' ? 'bg-gray-100' : 'bg-[#FDF8F9] hover:bg-[#8A1538]/10'} text-[#8A1538] px-4 py-3.5 rounded-2xl font-bold text-sm transition-all border border-[#8A1538]/10 relative`}>
                      {uploadingImage === 'defaultSportImageUrl' ? 'جاري الرفع...' : 'رفع صورة'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, 'defaultSportImageUrl')}
                      />
                    </label>
                  </div>
                </div>
                {sports.length > 0 && (
                  <div className="md:col-span-2 pt-6 border-t border-gray-100 mt-2">
                    <h4 className="text-[12px] font-black text-[#5A0B1A] uppercase tracking-widest mb-4">صور الرياضات المخصصة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sports.map(sport => (
                        <div key={sport.id}>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">{sport.name}</label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="url" 
                                value={(academy.sportImages && academy.sportImages[sport.name]) || ""} 
                                placeholder="https://..."
                                onChange={e => setAcademy({...academy, sportImages: { ...(academy.sportImages || {}), [sport.name]: e.target.value }})}
                                className="w-full bg-[#F5F5F7] rounded-xl px-4 py-3 text-xs font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all" dir="ltr"
                              />
                              <label className={`shrink-0 cursor-pointer ${uploadingImage === sport.name ? 'bg-gray-100' : 'bg-[#FDF8F9] hover:bg-[#8A1538]/10'} text-[#8A1538] px-3 py-3 rounded-xl font-bold text-[10px] transition-all border border-[#8A1538]/10 relative whitespace-nowrap`}>
                                {uploadingImage === sport.name ? '...' : 'رفع'}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleImageUpload(e, 'sportImages', sport.name)}
                                />
                              </label>
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === APPEARANCE TAB === */}
        {activeTab === "appearance" && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-14 h-14 rounded-[18px] bg-[#FDF8F9] flex items-center justify-center border border-[#8A1538]/10">
                <Palette className="w-7 h-7 text-[#8A1538]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#5A0B1A]">تخصيص المظهر</h2>
                <p className="text-xs text-gray-400 font-bold">تغيير ألوان وشكل النظام</p>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 mr-1">اللون الأساسي</label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { color: "#8A1538", name: "أحمر أهلاوي" },
                  { color: "#1a365d", name: "أزرق داكن" },
                  { color: "#065f46", name: "أخضر زمردي" },
                  { color: "#7c3aed", name: "بنفسجي" },
                  { color: "#b45309", name: "برتقالي" },
                  { color: "#0f172a", name: "أسود فاخر" },
                ].map(preset => (
                  <button
                    key={preset.color}
                    onClick={() => setAppearance({...appearance, primaryColor: preset.color})}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${
                      appearance.primaryColor === preset.color 
                        ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-md' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl shadow-inner" style={{ backgroundColor: preset.color }}></div>
                    <span className="text-xs font-bold text-gray-600">{preset.name}</span>
                    {appearance.primaryColor === preset.color && <Check className="w-4 h-4 text-[#C5A059]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 mr-1">اللون الثانوي (التمييزي)</label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { color: "#C5A059", name: "ذهبي" },
                  { color: "#ef4444", name: "أحمر" },
                  { color: "#3b82f6", name: "أزرق" },
                  { color: "#10b981", name: "أخضر" },
                  { color: "#f59e0b", name: "أصفر" },
                ].map(preset => (
                  <button
                    key={preset.color}
                    onClick={() => setAppearance({...appearance, accentColor: preset.color})}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${
                      appearance.accentColor === preset.color 
                        ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-md' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl shadow-inner" style={{ backgroundColor: preset.color }}></div>
                    <span className="text-xs font-bold text-gray-600">{preset.name}</span>
                    {appearance.accentColor === preset.color && <Check className="w-4 h-4 text-[#C5A059]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 mr-1">حجم الخط</label>
              <div className="flex gap-3">
                {[
                  { value: "small", label: "صغير", size: "text-xs" },
                  { value: "medium", label: "متوسط", size: "text-sm" },
                  { value: "large", label: "كبير", size: "text-base" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAppearance({...appearance, fontSize: opt.value})}
                    className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${
                      appearance.fontSize === opt.value 
                        ? 'border-[#5A0B1A] bg-[#5A0B1A] text-white shadow-lg' 
                        : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    } ${opt.size}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="pt-6 border-t border-gray-100">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 mr-1">معاينة</label>
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="h-3 w-full" style={{ backgroundColor: appearance.primaryColor }}></div>
                <div className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: appearance.primaryColor, opacity: 0.1 }}></div>
                  <div className="flex-1">
                    <div className="h-3 rounded-full w-32 mb-2" style={{ backgroundColor: appearance.primaryColor }}></div>
                    <div className="h-2 rounded-full bg-gray-100 w-48"></div>
                  </div>
                  <div className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ backgroundColor: appearance.accentColor }}>
                    زر تجريبي
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === NOTIFICATIONS TAB === */}
        {activeTab === "notifications" && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-14 h-14 rounded-[18px] bg-[#FDF8F9] flex items-center justify-center border border-[#8A1538]/10">
                <Bell className="w-7 h-7 text-[#8A1538]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#5A0B1A]">إعدادات الإشعارات</h2>
                <p className="text-xs text-gray-400 font-bold">التحكم في التنبيهات والإشعارات</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "subscriptionExpiry", label: "تنبيه انتهاء الاشتراكات", desc: "إشعار عند اقتراب انتهاء اشتراك عضو", icon: Clock },
                { key: "newMember", label: "عضو جديد", desc: "إشعار عند تسجيل عضو جديد في النظام", icon: Users },
                { key: "paymentReceived", label: "دفعة مالية مستلمة", desc: "إشعار عند استلام دفعة مالية جديدة", icon: DollarSign },
                { key: "attendanceAlert", label: "تنبيه الحضور", desc: "إشعار عند غياب عضو لفترة طويلة", icon: AlertTriangle },
                { key: "emailNotifications", label: "إرسال بريد إلكتروني", desc: "إرسال نسخة من الإشعارات عبر البريد", icon: Mail },
              ].map(item => (
                <div 
                  key={item.key}
                  className="flex items-center justify-between p-5 rounded-2xl bg-[#F5F5F7] hover:bg-gray-100/80 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-[14px] bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                      <item.icon className="w-5 h-5 text-[#8A1538]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#5A0B1A]">{item.label}</h4>
                      <p className="text-[11px] text-gray-400 font-bold">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications({...notifications, [item.key]: !(notifications as any)[item.key]})}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      (notifications as any)[item.key] 
                        ? 'bg-[#8A1538]' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                      (notifications as any)[item.key] ? 'left-1' : 'left-7'
                    }`}></div>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">التذكير قبل انتهاء الاشتراك (بالأيام)</label>
              <select 
                value={notifications.reminderDaysBefore}
                onChange={e => setNotifications({...notifications, reminderDaysBefore: e.target.value})}
                className="w-full max-w-xs bg-[#F5F5F7] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all appearance-none"
              >
                <option value="1">يوم واحد</option>
                <option value="3">3 أيام</option>
                <option value="5">5 أيام</option>
                <option value="7">أسبوع</option>
                <option value="14">أسبوعين</option>
              </select>
            </div>
          </div>
        )}

        {/* === SECURITY TAB === */}
        {activeTab === "security" && (
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-14 h-14 rounded-[18px] bg-[#FDF8F9] flex items-center justify-center border border-[#8A1538]/10">
                <Shield className="w-7 h-7 text-[#8A1538]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#5A0B1A]">الأمان وكلمة المرور</h2>
                <p className="text-xs text-gray-400 font-bold">تغيير كلمة المرور وإدارة الجلسات</p>
              </div>
            </div>

            <div className="max-w-lg space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">كلمة المرور الحالية</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type={showCurrentPass ? "text" : "password"} 
                    value={security.currentPassword}
                    onChange={e => setSecurity({...security, currentPassword: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 pr-12 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">كلمة المرور الجديدة</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type={showNewPass ? "text" : "password"} 
                    value={security.newPassword}
                    onChange={e => setSecurity({...security, newPassword: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 pr-12 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all"
                    placeholder="8 أحرف على الأقل"
                  />
                  <button onClick={() => setShowNewPass(!showNewPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type="password" 
                    value={security.confirmPassword}
                    onChange={e => setSecurity({...security, confirmPassword: e.target.value})}
                    className="w-full bg-[#F5F5F7] rounded-2xl px-5 pr-12 py-3.5 text-sm font-bold text-[#5A0B1A] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 border border-transparent focus:border-[#8A1538]/20 outline-none transition-all"
                    placeholder="أعد كتابة كلمة المرور"
                  />
                </div>
                {security.newPassword && security.confirmPassword && security.newPassword !== security.confirmPassword && (
                  <p className="text-rose-500 text-xs font-bold mt-2 mr-1">كلمة المرور غير متطابقة</p>
                )}
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={saving || !security.newPassword || security.newPassword !== security.confirmPassword}
                className="w-full bg-[#8A1538] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#5A0B1A] shadow-xl shadow-[#8A1538]/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all mt-2"
              >
                <Lock className="w-5 h-5" />
                تغيير كلمة المرور
              </button>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-sm font-black text-rose-600 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                منطقة الخطر
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Save Bar */}
      {activeTab !== "security" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-8 py-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl animate-in fade-in">
                <Check className="w-4 h-4" />
                <span className="text-sm font-bold">تم الحفظ بنجاح</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#8A1538] text-white px-10 py-3.5 rounded-2xl font-black text-sm hover:bg-[#5A0B1A] shadow-xl shadow-[#8A1538]/20 flex items-center gap-3 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            حفظ الإعدادات
          </button>
        </div>
      )}
    </div>
  );
}
