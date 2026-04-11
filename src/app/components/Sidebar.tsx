"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { insforge } from "@/lib/insforge/client";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Wallet,
  Medal,
  Award,
  FileText,
  Settings,
  LogOut,
  Shield,
  UserCog,
  ClipboardList,
  Package,
  Globe,
  MessageSquare,
  DollarSign,
} from "lucide-react";

const navigation = [
  { name: "واجهة الموقع", href: "/", icon: Globe },
  { name: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
  { name: "طلبات الانضمام", href: "/admin/leads", icon: MessageSquare },
  { name: "الأعضاء", href: "/admin/members", icon: Users },
  { name: "الاشتراكات", href: "/admin/subscriptions", icon: CreditCard },
  { name: "الحضور", href: "/admin/attendance", icon: CalendarCheck },
  { name: "الحسابات والمدفوعات", href: "/admin/payments", icon: Wallet },
  { name: "الأحزمة والاختبارات", href: "/admin/belt-tests", icon: Medal },
  { name: "المدربون والرواتب", href: "/admin/coaches", icon: Award },
  { name: "رواتب المدربين الشهرية", href: "/admin/coach-salary", icon: DollarSign },
  { name: "حضور المدربين", href: "/admin/coach-attendance", icon: ClipboardList },
  { name: "المخزن", href: "/admin/inventory", icon: Package },
  { name: "التقارير", href: "/admin/reports", icon: FileText },
  { name: "المستخدمون", href: "/admin/users", icon: UserCog },
  { name: "الإعدادات", href: "/admin/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    localStorage.removeItem("isAdminLogged");
    await insforge.auth.signOut();
    router.push("/login");
  };

  return (
    <div className={cn("flex flex-col w-72 min-h-screen bg-[#8A1538] print:hidden", className)}>
      {/* Logo / Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white p-1 shrink-0 overflow-hidden">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight block leading-tight">
            أكاديمية النادي الأهلي
          </span>
          <span className="text-[11px] text-gray-400 font-medium">لفنون الدفاع عن النفس</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto px-3 py-5">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive
                    ? "text-[#C5A059] bg-[#5D1026] shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "ml-3 flex-shrink-0 h-5 w-5 transition-colors duration-200",
                    isActive ? "text-[#C5A059]" : "text-white/50 group-hover:text-white/80"
                  )}
                  aria-hidden="true"
                />
                {item.name}
                {isActive && (
                  <div className="mr-auto w-1 h-5 rounded-full bg-[#C5A059]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200"
          >
            <LogOut className="ml-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-red-400 transition-colors" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
