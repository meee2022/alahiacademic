"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, X } from "lucide-react";

export default function DashboardDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date") || "";

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("date", val);
    } else {
      params.delete("date");
    }
    router.push(`?${params.toString()}`);
  };

  const clearDate = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 bg-[#f4f4f5] text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200">
      <CalendarDays className="h-4 w-4 text-[#670024]" />
      <input
        type="date"
        value={dateParam}
        onChange={handleDateChange}
        className="bg-transparent border-none outline-none text-xs font-bold text-[#670024] cursor-pointer"
      />
      {dateParam && (
        <button onClick={clearDate} className="p-0.5 hover:bg-gray-200 rounded-full transition-colors ml-1">
          <X className="h-3 w-3 text-gray-400" />
        </button>
      )}
    </div>
  );
}
