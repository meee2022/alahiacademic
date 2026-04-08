"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge/client";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // OTP verification state
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Admin bypass
    if (email === "eng.mohamed87@live.com" && password === "Realmadridclub@2604") {
      localStorage.setItem("isAdminLogged", "true");
      router.push("/admin");
      setTimeout(() => setIsLoading(false), 500);
      return;
    }

    try {
      const { data, error: authError } = await insforge.auth.signInWithPassword({ email, password });

      if (authError) {
        const msg = authError.message?.toLowerCase() || "";
        if (authError.statusCode === 403 || msg.includes("verif") || msg.includes("confirm")) {
          setError("يجب تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد وأدخل رمز التحقق.");
          setOtpEmail(email);
          setNeedsOtp(true);
          setTab("register");
        } else {
          setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        }
      } else {
        // Check if user is an admin
        const { data: userData } = await insforge.database
          .from("systemuser")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        if (userData?.role === "admin" || userData?.role === "coach" || userData?.role === "accountant" || userData?.role === "receptionist") {
          localStorage.setItem("isAdminLogged", "true");
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (regPassword !== regConfirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (regPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    setRegLoading(true);
    try {
      const { data, error: signUpError } = await insforge.auth.signUp({
        email: regEmail,
        password: regPassword,
        name: regName,
      });

      if (signUpError) {
        setError(signUpError.message || "حدث خطأ أثناء إنشاء الحساب.");
      } else if (data?.requireEmailVerification) {
        // Fallback in case server still requires OTP
        setOtpEmail(regEmail);
        setNeedsOtp(true);
        setSuccess(`تم إرسال رمز التحقق إلى ${regEmail} — أدخله أدناه.`);
      } else {
        // No verification needed — signed in directly
        setSuccess("✅ تم إنشاء الحساب بنجاح! جاري التحويل...");
        setTimeout(() => router.push("/"), 1200);
      }
    } catch (err: any) {
      setError("حدث خطأ: " + (err?.message || ""));
    } finally {
      setRegLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpLoading(true);
    try {
      const { data, error: verifyError } = await insforge.auth.verifyEmail({
        email: otpEmail,
        otp: otp.trim(),
      });
      if (verifyError) {
        setError("الرمز غير صحيح أو منتهي الصلاحية. حاول مرة أخرى أو اطلب رمزاً جديداً.");
      } else {
        // Auto signed in after verifyEmail
        setSuccess("تم التحقق بنجاح! جاري تحويلك...");
        setTimeout(() => router.push("/"), 1000);
      }
    } catch (err: any) {
      setError("حدث خطأ: " + (err?.message || ""));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await insforge.auth.resendVerificationEmail({ email: otpEmail });
      setSuccess("تم إعادة إرسال رمز التحقق. تحقق من بريدك الإلكتروني.");
    } catch {
      setError("تعذر إعادة الإرسال. حاول بعد قليل.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfaf6] to-[#f5eee8] py-12 px-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 border border-[#8A1538]/10">
            <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#5A0B1A] text-center leading-tight">
            أكاديمية النادي الأهلي
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">لفنون الدفاع عن النفس</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTab("login"); setError(null); setSuccess(null); }}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                tab === "login"
                  ? "text-[#8A1538] border-b-2 border-[#8A1538] bg-[#fdfaf6]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setTab("register"); setError(null); setSuccess(null); }}
              className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                tab === "register"
                  ? "text-[#8A1538] border-b-2 border-[#8A1538] bg-[#fdfaf6]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              إنشاء حساب
            </button>
          </div>

          <div className="p-8">
            {/* Error / success */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm px-4 py-3 rounded-xl font-medium">
                {success}
              </div>
            )}

            {/* ====== LOGIN FORM ====== */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-sm transition-all pr-10"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #8A1538, #5A0B1A)" }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> جاري الدخول...</span>
                  ) : (
                    <><LogIn className="w-4 h-4" /> تسجيل الدخول</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-2">
                  ليس لديك حساب؟{" "}
                  <button type="button" onClick={() => setTab("register")} className="text-[#8A1538] font-bold hover:underline">
                    أنشئ حساباً الآن
                  </button>
                </p>
              </form>
            )}

            {/* ====== REGISTER FORM / OTP ====== */}
            {tab === "register" && (
              needsOtp ? (
                /* OTP verification step */
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">📧</span>
                    </div>
                    <p className="text-sm font-bold text-gray-700">تم إرسال رمز التحقق إلى:</p>
                    <p className="text-sm text-[#8A1538] font-mono font-bold mt-1" dir="ltr">{otpEmail}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                      رمز التحقق (6 أرقام)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      dir="ltr"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-center text-xl font-mono font-bold tracking-widest transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={otpLoading || otp.length < 6}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #8A1538, #5A0B1A)" }}
                  >
                    {otpLoading ? <><span className="animate-spin">⏳</span> جاري التحقق...</> : "✅ تأكيد الحساب"}
                  </button>
                  <div className="flex items-center justify-between text-xs">
                    <button type="button" onClick={() => { setNeedsOtp(false); setOtp(""); setError(null); setSuccess(null); }} className="text-gray-400 hover:text-gray-600">
                      ← رجوع
                    </button>
                    <button type="button" onClick={handleResendOtp} disabled={resendLoading} className="text-[#8A1538] font-bold hover:underline disabled:opacity-50">
                      {resendLoading ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
                    </button>
                  </div>
                </form>
              ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="6 أحرف على الأقل"
                      dir="ltr"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-sm transition-all pr-10"
                    />
                    <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    تأكيد كلمة المرور
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] outline-none text-sm transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(135deg, #C5A059, #8B6914)" }}
                >
                  {regLoading ? (
                    <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> جاري الإنشاء...</span>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> إنشاء الحساب</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-2">
                  لديك حساب بالفعل؟{" "}
                  <button type="button" onClick={() => setTab("login")} className="text-[#8A1538] font-bold hover:underline">
                    سجّل دخولك
                  </button>
                </p>
              </form>
              ) /* end needsOtp ternary */
            )}
          </div>
        </div>

        {/* Back to site */}
        <p className="text-center mt-6 text-sm text-gray-400">
          <a href="/" className="hover:text-[#8A1538] transition-colors font-medium">
            ← العودة إلى الموقع
          </a>
        </p>
      </div>
    </div>
  );
}
