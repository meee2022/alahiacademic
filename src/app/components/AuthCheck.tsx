"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { insforge } from "@/lib/insforge/client";

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // TEMPORARY BYPASS: Assume session is valid for the demo admin
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fdfaf6]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
