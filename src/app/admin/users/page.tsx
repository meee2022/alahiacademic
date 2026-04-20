"use client";

import { useEffect, useState } from "react";
import { UserCog, Plus, Loader2, Edit, Trash2, X, Save, Shield, ShieldCheck, ShieldAlert, RefreshCw, Users } from "lucide-react";
import { insforge } from "@/lib/insforge/client";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "coach" | "accountant" | "receptionist";
  linked_coach_id: string | null;
  password_hash: string;
};

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  created_at?: string;
  user_metadata?: { full_name?: string; name?: string };
};

const ROLE_LABELS: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
  admin:        { label: "مدير النظام",   color: "text-rose-700",   bgColor: "bg-rose-50",    borderColor: "border-rose-200",  icon: ShieldAlert },
  coach:        { label: "مدرب",          color: "text-blue-700",   bgColor: "bg-blue-50",    borderColor: "border-blue-200",  icon: ShieldCheck },
  accountant:   { label: "محاسب",         color: "text-amber-700",  bgColor: "bg-amber-50",   borderColor: "border-amber-200", icon: Shield },
  receptionist: { label: "موظف استقبال", color: "text-green-700",  bgColor: "bg-green-50",   borderColor: "border-green-200", icon: Shield },
  none:         { label: "بدون صلاحية",  color: "text-gray-500",   bgColor: "bg-gray-50",    borderColor: "border-gray-200",  icon: Shield },
};

export default function UsersPage() {
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [selectedAuthUser, setSelectedAuthUser] = useState<AuthUser | null>(null);

  const [form, setForm] = useState({ name: "", email: "", role: "receptionist" as string, password_hash: "N/A" });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    
    // 1. Fetch SystemUsers (have roles) - Isolated try/catch
    try {
      const { data: sysData, error: sysError } = await insforge.database
        .from("systemuser")
        .select("*")
        .order("name");
      
      if (sysError) {
        console.warn("SystemUser fetch error:", sysError);
        setSystemUsers([]);
      } else if (sysData) {
        setSystemUsers(sysData as SystemUser[]);
      }
    } catch (err) {
      console.warn("SystemUser catch error:", err);
      setSystemUsers([]);
    }

    // 2. Fetch Auth users list via our server-side proxy (Isolated)
    try {
      const res = await fetch("/api/admin/auth-users", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAuthUsers(json.users || []);
      } else {
        const errText = await res.text();
        console.warn("auth-users API error:", res.status, errText);
        setAuthUsers([]);
      }
    } catch (err) {
      console.warn("auth-users fetch error:", err);
      setAuthUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Get all unique users (auth + system)
  const allEmails = new Set([
    ...systemUsers.map(u => u.email),
    ...authUsers.map(u => u.email),
  ]);

  const mergedUsers = Array.from(allEmails).map(email => {
    const sys = systemUsers.find(u => u.email === email);
    const auth = authUsers.find(u => u.email === email);
    return { email, sys, auth };
  });

  const openAssignRole = (email: string, authUser?: AuthUser, sysUser?: SystemUser) => {
    setEditingUser(sysUser || null);
    setSelectedAuthUser(authUser || null);
    setForm({
      name: sysUser?.name || authUser?.user_metadata?.full_name || "",
      email: email,
      role: sysUser?.role || "receptionist",
      password_hash: sysUser?.password_hash || "N/A",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.email.trim() || !form.name.trim()) {
      alert("يرجى إدخال الاسم والبريد الإلكتروني");
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        // Update existing SystemUser
        const { error } = await insforge.database
          .from("systemuser")
          .update({ name: form.name, role: form.role as any })
          .eq("id", editingUser.id);
        if (error) throw error;
      } else {
        // Insert new SystemUser row
        const { error } = await insforge.database
          .from("systemuser")
          .insert([{ 
            name: form.name, 
            email: form.email, 
            role: form.role as any,
            password_hash: "auth_managed",
            linked_coach_id: null
          }]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchAll();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (sysUser: SystemUser) => {
    if (!confirm(`هل تريد إزالة صلاحيات "${sysUser.name}"؟ سيتم حذف الدور الإداري فقط.`)) return;
    try {
      const { error } = await insforge.database.from("systemuser").delete().eq("id", sysUser.id);
      if (error) throw error;
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200/60 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl" style={{ background: "linear-gradient(135deg, #7a1b32, #c0392b)" }}>
            <UserCog className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين والصلاحيات</h1>
            <p className="mt-1 text-sm text-gray-500">جميع الحسابات المسجلة — يمكنك تعيين دور إداري لأي منها</p>
          </div>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2.5 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </button>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ROLE_LABELS).filter(([k]) => k !== "none").map(([key, val]) => (
          <div key={key} className={`${val.bgColor} border ${val.borderColor} rounded-xl p-3 flex items-center gap-2`}>
            <val.icon className={`h-4 w-4 ${val.color} shrink-0`} />
            <div>
              <p className={`text-xs font-bold ${val.color}`}>{val.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">

        {/* Section: SystemUsers with roles */}
        <div className="px-6 py-4 border-b border-gray-100 bg-[#fdfaf6] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-primary">الحسابات ذات الصلاحيات الإدارية</span>
          <span className="mr-auto bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{systemUsers.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">البريد</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الدور</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" /></td></tr>
              ) : systemUsers.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">لا يوجد مستخدمون إداريون حتى الآن</td></tr>
              ) : (
                systemUsers.map((user, idx) => {
                  const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.none;
                  return (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-bold">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono" dir="ltr">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${roleInfo.bgColor} ${roleInfo.color} border ${roleInfo.borderColor}`}>
                          <roleInfo.icon className="h-3.5 w-3.5" />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openAssignRole(user.email, undefined, user)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="تعديل الدور"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleRemoveRole(user)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all" title="إزالة الصلاحية"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Section: Auth users without roles */}
        <div className="px-6 py-4 border-t border-b border-gray-100 bg-amber-50/50 flex items-center gap-2 mt-2">
          <Users className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-sm text-amber-700">حسابات مسجلة بدون صلاحيات إدارية</span>
          <span className="mr-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {authUsers.filter(a => !systemUsers.find(s => s.email === a.email)).length}
          </span>
        </div>

        {(() => {
          const unassigned = authUsers.filter(a => !systemUsers.find(s => s.email === a.email));
          if (unassigned.length === 0) {
            return (
              <div className="px-6 py-6 text-center">
                <p className="text-sm text-gray-400 mb-1">
                  {authUsers.length === 0
                    ? "لا توجد حسابات مسجلة بعد، أو تعذّر تحميلها."
                    : "✅ جميع الحسابات المسجلة لديها أدوار إدارية."}
                </p>
                <button
                  onClick={() => { setEditingUser(null); setSelectedAuthUser(null); setForm({ name: "", email: "", role: "receptionist", password_hash: "auth_managed" }); setShowModal(true); }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-xl transition-all hover:shadow-md"
                  style={{ background: "linear-gradient(135deg, #7a1b32, #c0392b)" }}
                >
                  <Plus className="h-4 w-4" />
                  إضافة مستخدم يدوياً
                </button>
              </div>
            );
          }
          return (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody className="divide-y divide-gray-50">
                  {unassigned.map((authUser, idx) => (
                      <tr key={authUser.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono w-10">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {authUser.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono" dir="ltr">{authUser.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            <Shield className="h-3.5 w-3.5" />
                            بدون صلاحية
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openAssignRole(authUser.email, authUser)}
                            className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:shadow"
                            style={{ background: "linear-gradient(135deg, #7a1b32, #c0392b)" }}
                          >
                            تعيين دور
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Manual add button if auth API not available */}
        {authUsers.length === 0 && (
          <div className="px-6 pb-4" />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? "تعديل صلاحية المستخدم" : "تعيين دور لمستخدم"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">الاسم الكامل *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7a1b32]/20 focus:border-[#7a1b32] outline-none text-sm"
                  placeholder="اسم المستخدم" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">البريد الإلكتروني *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingUser || !!selectedAuthUser}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7a1b32]/20 focus:border-[#7a1b32] outline-none text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="example@email.com" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">الدور / الصلاحية</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7a1b32]/20 focus:border-[#7a1b32] outline-none text-sm bg-white">
                  <option value="admin">مدير النظام — صلاحية كاملة</option>
                  <option value="coach">مدرب</option>
                  <option value="accountant">محاسب</option>
                  <option value="receptionist">موظف استقبال</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end shrink-0">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm">إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-white rounded-xl transition-all hover:shadow-lg disabled:opacity-50 font-bold text-sm flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #7a1b32, #c0392b)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingUser ? "حفظ التعديلات" : "تعيين الدور"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
