import { Sidebar } from "@/app/components/Sidebar";
import { AuthCheck } from "@/app/components/AuthCheck";
import { MobileBottomNav } from "@/app/components/MobileBottomNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck>
      <div className="flex h-screen overflow-hidden print:h-auto print:block print:overflow-visible">
        <Sidebar className="hidden md:flex print:hidden" />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8 bg-[#F5F5F7] print:overflow-visible print:p-0 print:bg-white">
          {children}
        </main>
        <div className="print:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </AuthCheck>
  );
}
