"use client";

import { useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";

export default function ExpiringSubscriptionsWidget({
  expiring,
  sports,
}: {
  expiring: any[];
  sports: { id: string; name: string }[];
}) {
  const [selectedSport, setSelectedSport] = useState<string>("all");

  const filteredExpiring =
    selectedSport === "all"
      ? expiring
      : expiring.filter((sub) => sub.Sport?.name === selectedSport);

  if (expiring.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900">اشتراكات تنتهي قريباً</h3>
            <p className="text-sm text-amber-700">الاشتراكات المنتهية خلال الـ 14 يوم القادمة</p>
          </div>
        </div>

        <div>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-amber-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 text-sm font-medium shadow-sm outline-none"
          >
            <option value="all">جميع الرياضات ({expiring.length})</option>
            {sports.map((sport) => {
              const count = expiring.filter((sub) => sub.Sport?.name === sport.name).length;
              if (count === 0) return null;
              return (
                <option key={sport.id} value={sport.name}>
                  {sport.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {filteredExpiring.length > 0 ? (
          filteredExpiring.map((sub: any) => (
            <div key={sub.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100 shadow-sm transition-all hover:border-amber-300">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{sub.Member?.fullNameArabic || "غير محدد"}</p>
                  <p className="text-xs text-gray-500">{sub.Sport?.name || "غير محدد"}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg shadow-sm">
                {new Date(sub.subscriptionEnd).toLocaleDateString("ar-EG")}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-amber-600/80 font-medium text-sm border-2 border-dashed border-amber-200/50 rounded-xl">
            لا توجد اشتراكات منتهية قريباً لهذه الرياضة
          </div>
        )}
      </div>
    </div>
  );
}
