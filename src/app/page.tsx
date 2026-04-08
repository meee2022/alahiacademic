"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home as HomeIcon, Phone, MapPin, ChevronLeft, Award, Users, Trophy, Star, Clock, Shield, ArrowLeft, Instagram, Twitter, MessageCircle, LogOut } from "lucide-react";
import { insforge } from "@/lib/insforge/client";

// Default settings
const defaults = {
  name: "أكاديمية النادي الأهلي",
  subtitle: "لفنون الدفاع عن النفس",
  phone: "",
  address: "قطر",
  whatsapp: "",
  instagram: "",
  twitter: "",
  mapUrl: "",
  tagline: "انضم إلينا اليوم وابدأ رحلتك في عالم القوة واللياقة البدنية مع نخبة من أفضل المدربين",
  heroImageUrl: "/hero.jpg",
  defaultSportImageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800",
  sportImages: {} as Record<string, string>,
};

// Sport images for cards
const sportImages: Record<string, string> = {
  "كاراتيه": "/karate.jpg",
  "تايكوندو": "/Taekwondo.jpg",
  "جمباز": "/Gymnastics.jpg",
  "أرنيس": "/arnis.png",
  "كيك بوكسينج": "/kickboxing.png",
  "جودو": "/judo.png",
  "مصارعة": "/wrestling.png",
  "Karate": "/karate.jpg",
  "Taekwondo": "/Taekwondo.jpg",
  "Gymnastics": "/Gymnastics.jpg",
  "Arnis": "/arnis.png",
  "Kickboxing": "/kickboxing.png",
  "Judo": "/judo.png",
  "Wrestling": "/wrestling.png",
};
const defaultSportImage = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800";

const sportGradients = [
  "from-[#8A1538] to-[#5A0B1A]",
  "from-[#C5A059] to-[#8B6914]",
  "from-[#1a365d] to-[#0d1b2a]",
  "from-[#065f46] to-[#022c22]",
  "from-[#7c3aed] to-[#4c1d95]",
  "from-[#b45309] to-[#78350f]",
];

export default function Home() {
  const router = useRouter();
  const [sports, setSports] = useState<any[]>([]);
  const [settings, setSettings] = useState(defaults);
  const [scrolled, setScrolled] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const handleLogout = async () => {
    localStorage.removeItem("isAdminLogged");
    await insforge.auth.signOut();
    setIsLogged(false);
    router.refresh();
  };

  // Lead form
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSport, setLeadSport] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("isAdminLogged") === "true") {
      setIsLogged(true);
    }
    // Load settings from localStorage
    const saved = localStorage.getItem("academy_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.academy) setSettings(prev => ({ ...prev, ...parsed.academy }));
      } catch {}
    }

    // Fetch sports
    insforge.database.from("Sport").select("id, name").eq("isActive", true).order("name").then(({ data }) => {
      if (data) setSports(data);
    });

    // Scroll listener
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadLoading(true);
    try {
      await insforge.database.from("Lead").insert([{ name: leadName, phone: leadPhone, sportInterest: leadSport }]);
      setLeadSuccess(true);
      setLeadName(""); setLeadPhone(""); setLeadSport("");
    } catch (err) {
      alert("حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.");
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased overflow-x-hidden font-body pb-24 md:pb-0" dir="rtl">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-[0_16px_32px_-12px_rgba(138,21,56,0.1)]' : 'bg-transparent'}`}>
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div className={`text-xl font-black tracking-tighter font-headline text-primary`}>
              {settings.name.toUpperCase()}
            </div>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a className={`hover:text-primary transition-colors font-bold tracking-tight ${scrolled ? 'text-on-surface-variant' : 'text-on-surface-variant/80'}`} href="#sports">البرامج</a>
            <a className={`hover:text-primary transition-colors font-bold tracking-tight ${scrolled ? 'text-on-surface-variant' : 'text-on-surface-variant/80'}`} href="#features">المميزات</a>
            <a className={`hover:text-primary transition-colors font-bold tracking-tight ${scrolled ? 'text-on-surface-variant' : 'text-on-surface-variant/80'}`} href="#contact">تواصل معنا</a>
          </div>
          {isLogged ? (
            <div className="flex items-center gap-2">
              <Link href="/admin" className="bg-secondary text-white px-6 py-2 rounded-xl font-bold hover:opacity-80 transition-all duration-300 scale-95 active:scale-90 shadow-lg shadow-secondary/20 flex gap-2 items-center">
                لوحة التحكم
              </Link>
              <button
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="bg-white/10 border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-200 hover:bg-red-50 p-2 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:opacity-80 transition-all duration-300 scale-95 active:scale-90 shadow-lg shadow-primary/20">
              دخول
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-surface-container-low">
        {/* Background Decor */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none select-none overflow-hidden flex items-center justify-center">
          <span className="text-[25rem] font-black text-primary leading-none -mr-40 opacity-20">الأهلي</span>
        </div>

        <div className="max-w-7xl mx-auto px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary-container/30 px-4 py-1.5 rounded-full border border-secondary/20 shadow-sm backdrop-blur-sm">
              <span className="material-symbols-outlined text-secondary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="text-on-secondary-fixed-variant text-xs font-bold tracking-widest uppercase">التسجيل مفتوح الآن | REGISTRATION OPEN</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-primary leading-[1.1] tracking-tighter">
              {settings.name.split(' ').slice(0, 1)} <br/>
              <span className="text-secondary italic">{settings.name.split(' ').slice(1).join(' ')}</span>
            </h1>

            <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed font-medium">
              {settings.tagline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#contact" className="bg-primary text-on-primary px-8 py-4 md:px-10 md:py-5 rounded-xl text-lg font-bold shadow-[0_16px_32px_-8px_rgba(103,0,36,0.3)] hover:bg-tertiary transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                انضم إلينا الآن
                <ArrowLeft className="w-5 h-5" />
              </a>
              <a href="#sports" className="bg-surface-container-lowest text-secondary border border-secondary/20 px-8 py-4 md:px-10 md:py-5 rounded-xl text-lg font-bold hover:bg-white transition-all shadow-sm text-center">
                مشاهدة الحصص
              </a>
            </div>
          </div>

          <div className="relative group order-last lg:order-none mt-12 lg:mt-0 w-full max-w-sm sm:max-w-md mx-auto lg:max-w-none">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
            <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl border-4 border-white">
              <img 
                className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105" 
                src={settings.heroImageUrl || "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=1000"} 
                alt="Martial Arts" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 right-6 left-6 md:bottom-10 md:right-10 md:left-10 text-white">
                <div className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">{settings.name}</div>
                <div className="text-secondary-fixed font-bold tracking-widest text-[10px] md:text-sm opacity-90 uppercase">{settings.subtitle}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 bg-surface-container-lowest relative z-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center p-6 md:p-10 bg-surface-container-low rounded-3xl border border-white/50 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="text-3xl md:text-5xl font-black text-primary mb-2">+500</div>
              <div className="text-on-surface-variant font-bold uppercase tracking-widest text-[8px] md:text-xs">عضو مسجل</div>
              <div className="text-on-surface-variant/40 text-[8px] md:text-[10px] mt-1">ACTIVE MEMBERS</div>
            </div>
            <div className="text-center p-6 md:p-10 bg-surface-container-low rounded-3xl border border-white/50 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="text-3xl md:text-5xl font-black text-secondary mb-2">+15</div>
              <div className="text-on-surface-variant font-bold uppercase tracking-widest text-[8px] md:text-xs">مدرب محترف</div>
              <div className="text-on-surface-variant/40 text-[8px] md:text-[10px] mt-1">PRO TRAINERS</div>
            </div>
            <div className="text-center p-6 md:p-10 bg-surface-container-low rounded-3xl border-2 border-primary/5 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="text-3xl md:text-5xl font-black text-primary mb-2">6</div>
              <div className="text-on-surface-variant font-bold uppercase tracking-widest text-[8px] md:text-xs">رياضات متنوعة</div>
              <div className="text-on-surface-variant/40 text-[8px] md:text-[10px] mt-1">ELITE SPORTS</div>
            </div>
            <div className="text-center p-6 md:p-10 bg-primary rounded-3xl shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1">
              <div className="text-3xl md:text-5xl font-black text-white mb-2">24/7</div>
              <div className="text-white/80 font-bold uppercase tracking-widest text-[8px] md:text-xs">دعم مستمر</div>
              <div className="text-white/40 text-[8px] md:text-[10px] mt-1">CONSTANT SUPPORT</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Grid */}
      <section id="sports" className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-primary tracking-tighter font-headline">الرياضات المتاحة</h2>
              <p className="text-on-surface-variant text-xl font-medium">اختر مسارك القتالي وابدأ رحلة التميز</p>
            </div>
            <div className="h-[2px] flex-grow bg-surface-container-highest mx-8 hidden md:block mb-4"></div>
            <div className="text-secondary font-black text-6xl opacity-10 select-none tracking-tighter">SPORTS</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {sports.map((sport) => (
              <div key={sport.id} className="group relative overflow-hidden rounded-[2rem] aspect-video cursor-pointer bg-surface-container-highest shadow-lg">
                <img 
                  className="w-full h-full object-cover transition-all duration-700 scale-110 group-hover:scale-100" 
                  src={(settings.sportImages && settings.sportImages[sport.name]) || sportImages[sport.name] || settings.defaultSportImageUrl || defaultSportImage} 
                  alt={sport.name} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-80"></div>
                
                <div className="absolute bottom-4 right-4 left-4 md:bottom-8 md:right-8 md:left-8">
                  <div className="text-secondary font-bold text-[8px] md:text-[10px] tracking-widest uppercase mb-1 opacity-70">ACADEMY PROGRAM</div>
                  <div className="text-white text-xl md:text-3xl font-black tracking-tighter">{sport.name}</div>
                </div>
                
                <div className="absolute top-4 left-4 md:top-8 md:left-8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-4 group-hover:translate-x-0">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-secondary rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white text-lg md:text-2xl">arrow_outward</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Section */}
      <section id="features" className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 p-12 bg-white rounded-[2.5rem] shadow-sm space-y-6 border border-gray-100 transition-all hover:shadow-xl">
              <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-primary mb-3">مدربون معتمدون دولياً</h3>
                <p className="text-on-surface-variant text-lg leading-relaxed font-medium">فريقنا مكون من أبطال العالم ومدربين حاصلين على أعلى الشهادات الدولية لضمان تقديم تدريب احترافي حقيقي ومناسب لكل المستويات.</p>
              </div>
            </div>

            <div className="p-10 bg-primary text-white rounded-[2.5rem] flex flex-col justify-between shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
              <span className="material-symbols-outlined text-5xl opacity-50" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              <div>
                <h3 className="text-2xl font-bold mb-2">لكافة الأعمار</h3>
                <p className="text-white/70 text-sm font-medium">برامج مخصصة للأطفال من سن ٤ سنوات وللكبار والمحترفين، مسممة لتطوير المهارات الشخصية والبدنية.</p>
              </div>
            </div>

            <div className="p-10 bg-white rounded-[2.5rem] shadow-sm flex flex-col justify-between border-2 border-primary/5 transition-all hover:shadow-xl">
              <span className="material-symbols-outlined text-primary text-5xl">shield_with_heart</span>
              <div>
                <h3 className="text-2xl font-bold text-primary mb-2">بيئة آمنة</h3>
                <p className="text-on-surface-variant text-sm font-medium">أحدث التجهيزات الرياضية وأنظمة الحماية لضمان سلامة جميع المتدربين داخل صالاتنا المجهزة بالكامل.</p>
              </div>
            </div>

            <div className="md:col-span-4 p-10 bg-secondary-container/40 backdrop-blur-md border border-secondary/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:bg-secondary-container/50">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-3xl">schedule</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-on-secondary-fixed">مواعيد مرنة تناسب الجميع</h3>
                  <p className="text-on-secondary-fixed-variant font-medium opacity-80 mt-1">حصص صباحية ومسائية، وطوال أيام الأسبوع لراحتكم وتسهيل التزامكم بالتمارين.</p>
                </div>
              </div>
              <a href="#contact" className="bg-secondary text-white px-10 py-4 rounded-xl font-black hover:bg-secondary/90 transition-all shadow-lg active:scale-95">
                تواصل للاستفسار
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="bg-surface-container-lowest rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(138,21,56,0.1)] flex flex-col lg:flex-row border border-gray-100">
            {/* Form Area */}
            <div className="flex-1 p-12 lg:p-24 bg-white">
              {leadSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                    <span className="material-symbols-outlined text-emerald-600 text-5xl">check_circle</span>
                  </div>
                  <h2 className="text-4xl font-black text-primary">شكراً لاهتمامك!</h2>
                  <p className="text-on-surface-variant text-xl">سنتواصل معك خلال 24 ساعة لمناقشة التفاصيل.</p>
                  <button onClick={() => setLeadSuccess(false)} className="text-primary font-bold hover:underline">إرسال طلب آخر</button>
                </div>
              ) : (
                <>
                  <h2 className="text-5xl font-black text-primary mb-12 tracking-tighter font-headline">ابدأ رحلتك اليوم</h2>
                  <form className="space-y-8" onSubmit={handleLeadSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-on-surface-variant uppercase tracking-widest mr-1">الاسم الكامل</label>
                        <input 
                          required value={leadName} onChange={e => setLeadName(e.target.value)}
                          className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-8 focus:ring-2 focus:ring-primary/20 transition-all text-lg font-medium outline-none" 
                          placeholder="الاسم الثلاثي" 
                          type="text"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-on-surface-variant uppercase tracking-widest mr-1">رقم الهاتف</label>
                        <input 
                          required value={leadPhone} onChange={e => setLeadPhone(e.target.value)}
                          className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-8 focus:ring-2 focus:ring-primary/20 transition-all text-lg font-medium outline-none" 
                          placeholder="01XXXXXXXXX" 
                          type="tel"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-on-surface-variant uppercase tracking-widest mr-1">الرياضة المهتم بها</label>
                      <div className="relative">
                        <select 
                          required value={leadSport} onChange={e => setLeadSport(e.target.value)}
                          className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-8 focus:ring-2 focus:ring-primary/20 transition-all appearance-none text-lg font-medium outline-none cursor-pointer"
                        >
                          <option value="">اختر رياضة من القائمة</option>
                          {sports.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                          <span className="material-symbols-outlined text-on-surface-variant opacity-50">expand_more</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit" disabled={leadLoading}
                      className="w-full bg-primary text-white py-6 rounded-[1.25rem] text-2xl font-black shadow-[0_20px_40px_-12px_rgba(103,0,36,0.4)] hover:bg-tertiary transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                    >
                      {leadLoading ? "جاري الإرسال..." : "إرسال طلب الانضمام"}
                    </button>
                  </form>
                </>
              )}
            </div>
            
            {/* Contact Info Area */}
            <div className="lg:w-2/5 bg-gradient-to-br from-primary to-tertiary p-16 lg:p-24 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="text-secondary-fixed font-black text-3xl mb-12 tracking-tighter">معلومات التواصل</div>
                <div className="space-y-12">
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                      <span className="material-symbols-outlined text-secondary-fixed text-2xl">phone_in_talk</span>
                    </div>
                    <div>
                      <div className="font-bold text-xl mb-1 tracking-tight">رقم التواصل والواتساب</div>
                      <div className="text-white/70 text-lg leading-relaxed font-medium" dir="ltr">{settings.whatsapp || settings.phone || "لم يتم التحديد"}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                      <span className="material-symbols-outlined text-secondary-fixed text-2xl">location_on</span>
                    </div>
                    <div>
                      <div className="font-bold text-xl mb-1 tracking-tight">العنوان والمقر</div>
                      <div className="text-white/70 text-lg leading-relaxed font-medium">{settings.address || "لم يتم التحديد"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 relative z-10 border-t border-white/10 mt-12">
                <div className="text-xs font-black uppercase tracking-[0.3em] mb-6 opacity-40">Follow Academic | تابع الأكاديمية</div>
                <div className="flex gap-4">
                  {settings.instagram && (
                    <a href={`https://instagram.com/${settings.instagram}`} target="_blank" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                  {settings.twitter && (
                    <a href={`https://x.com/${settings.twitter}`} target="_blank" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                      <Twitter className="w-6 h-6" />
                    </a>
                  )}
                  <a href={`https://wa.me/${settings.whatsapp?.replace(/[^0-9]/g,'')}`} target="_blank" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <MessageCircle className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 w-full pt-24 pb-12 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain brightness-0 invert opacity-80" />
              <div className="text-2xl font-black font-headline tracking-tighter">
                {settings.name.toUpperCase()}
              </div>
            </div>
            <p className="text-zinc-400 text-lg leading-relaxed font-medium">
              نسعى لبناء جيل قوي بدنياً وذهنياً من خلال قيم الرياضة والانضباط. تراثنا هو التميز، ومستقبلنا هو صناعة الأبطال.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-secondary font-headline text-sm uppercase tracking-widest font-bold">Quick Links | روابط سريعة</h4>
            <ul className="space-y-4 font-bold">
              <li><Link href="/login" className="text-zinc-500 hover:text-white transition-colors text-base flex items-center gap-2">
                بوابة الموظفين
                <span className="material-symbols-outlined text-[14px]">logout</span>
              </Link></li>
              <li><a className="text-zinc-500 hover:text-white transition-colors text-base" href="#sports">الرياضات المتاحة</a></li>
              <li><a className="text-zinc-500 hover:text-white transition-colors text-base" href="#features">لماذا نحن؟</a></li>
              <li><a className="text-zinc-500 hover:text-white transition-colors text-base" href="#contact">انضم الآن</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-secondary font-headline text-sm uppercase tracking-widest font-bold">Support | الدعم والمساعدة</h4>
            <ul className="space-y-4 font-bold">
              <li><a className="text-zinc-500 hover:text-white transition-colors text-base" href="#">الأسئلة الشائعة</a></li>
              <li><a className="text-zinc-500 hover:text-white transition-colors text-base" href="#">مركز الدعم</a></li>
              <li><a className="text-zinc-500 hover:text-white transition-colors text-base" href="#contact">تواصل معنا</a></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-secondary font-headline text-sm uppercase tracking-widest font-bold">Newsletter | النشرة الإخبارية</h4>
            <div className="flex flex-col gap-5">
              <p className="text-zinc-500 text-sm font-medium">اشترك لتصلك أحدث العروض والبطولات حصرياً.</p>
              <div className="flex flex-col gap-3">
                <input className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-6 py-4 text-base focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-zinc-600" placeholder="البريد الإلكتروني" type="email"/>
                <button className="bg-primary text-white py-4 rounded-xl text-base font-bold shadow-lg shadow-black/20 hover:bg-tertiary transition-all">اشتراك الآن</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-8 mt-24 pt-10 border-t border-zinc-800/50 text-center relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60">
          <p className="font-headline text-xs uppercase tracking-widest">
            © {new Date().getFullYear()} {settings.name}. ALL RIGHTS RESERVED.
          </p>
          <div className="text-[10px] font-black tracking-[0.4em] uppercase">LEGACY OF DISCIPLINE</div>
        </div>
        
        {/* Footer Background Decor */}
        <div className="absolute bottom-0 right-0 text-[15rem] font-black text-white/5 select-none pointer-events-none translate-y-1/2 translate-x-1/4">AL AHLY</div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 pt-2 pb-5 flex items-center justify-around md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pt-safe">
        <a href="#" className="flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[64px] text-gray-500 hover:text-primary">
          <HomeIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </a>
        <a href="#sports" className="flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[64px] text-gray-500 hover:text-primary">
          <Trophy className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">البرامج</span>
        </a>
        <a href="#features" className="flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[64px] text-gray-500 hover:text-primary">
          <Star className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">المميزات</span>
        </a>
        <a href="#contact" className="flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[64px] text-gray-500 hover:text-primary">
          <Phone className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">تواصل</span>
        </a>
      </nav>
    </div>
  );
}
