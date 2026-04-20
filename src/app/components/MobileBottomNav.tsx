"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  UserCog,
  ClipboardList,
  Package,
  Menu,
  X,
  Globe,
  MessageSquare,
  LogOut
} from "lucide-react";

export const navigation = [
  { name: "واجهة الموقع", href: "/", icon: Globe },
  { name: "الرئيسية", href: "/admin", icon: LayoutDashboard },
  { name: "الطلبات", href: "/admin/leads", icon: MessageSquare },
  { name: "الأعضاء", href: "/admin/members", icon: Users },
  { name: "الاشتراكات", href: "/admin/subscriptions", icon: CreditCard },
  { name: "الحضور", href: "/admin/attendance", icon: CalendarCheck },
  { name: "الحسابات", href: "/admin/payments", icon: Wallet },
  { name: "الأحزمة", href: "/admin/belt-tests", icon: Medal },
  { name: "المدربون", href: "/admin/coaches", icon: Award },
  { name: "حضور المدربين", href: "/admin/coach-attendance", icon: ClipboardList },
  { name: "المخزن", href: "/admin/inventory", icon: Package },
  { name: "التقارير", href: "/admin/reports", icon: FileText },
  { name: "المستخدمون", href: "/admin/users", icon: UserCog },
  { name: "الإعدادات", href: "/admin/settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    localStorage.removeItem("isAdminLogged");
    await insforge.auth.signOut();
    router.push("/login");
  };

  const mainItems = [
    { name: "الرئيسية", href: "/admin", icon: LayoutDashboard },
    { name: "الأعضاء", href: "/admin/members", icon: Users },
    { name: "الاشتراكات", href: "/admin/subscriptions", icon: CreditCard },
    { name: "الحضور", href: "/admin/attendance", icon: CalendarCheck },
  ];

  return (
    <>
      {/* Full Screen Menu */}
      <div 
        className={cn(
          "fixed inset-0 bg-primary z-40 flex flex-col pt-10 px-4 pb-24 transition-transform duration-300 transform md:hidden overflow-y-auto print:hidden",
          isMenuOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white p-1 shrink-0 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all text-center",
                  isActive
                    ? "bg-secondary text-primary"
                    : "bg-white/5 text-white hover:bg-white/10"
                )}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>

      {/* Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 pt-2 pb-5 flex items-center justify-around md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pt-safe print:hidden">
        {mainItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <item.icon className={cn("w-6 h-6 mb-1 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-[10px] font-bold", isActive ? "text-primary" : "text-gray-500")}>
                {item.name}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[64px]",
             isMenuOpen ? "text-primary" : "text-gray-500 hover:bg-gray-50"
          )}
        >
          <Menu className={cn("w-6 h-6 mb-1 transition-transform", isMenuOpen && "scale-110")} />
          <span className="text-[10px] font-bold">المزيد</span>
        </button>
      </nav>
    </>
  );
}
