"use client";

import { useEffect, useState } from "react";
import { insforge } from "@/lib/insforge/client";
import { Trash2, CheckCircle2, Circle, MessageCircle, Phone, Clock, Loader2, Search } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLeads = async () => {
    try {
      const { data } = await insforge.database
        .from("Lead")
        .select("*")
        .order("createdAt", { ascending: false });
      
      const sortedData = data ? [...data].sort((a,b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()) : [];
      setLeads(sortedData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "contacted" ? "pending" : "contacted";
    try {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      await insforge.database.from("Lead").update({ status: newStatus }).eq("id", id);
    } catch (err) {
      console.error(err);
      fetchLeads(); // revert
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب بشكل نهائي؟")) return;
    try {
      setLeads(prev => prev.filter(l => l.id !== id));
      await insforge.database.from("Lead").delete().eq("id", id);
    } catch (err) {
      console.error(err);
      fetchLeads(); // revert
    }
  };

  const filteredLeads = leads.filter(l => 
    (l.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.phone || "").includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary mb-1">طلبات الانضمام</h1>
          <p className="text-sm font-medium text-gray-500">إدارة ومتابعة طلبات التسجيل الواردة من الموقع الإلكتروني.</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
        {/* Search Bar */}
        <div className="relative max-w-4xl mx-auto mb-8">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الرقم..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-6 pr-12 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary bg-[#F5F5F7] text-gray-900 font-medium transition-all"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد طلبات حالياً</h3>
          <p className="text-gray-500">لم يقم أي شخص بإرسال طلب انضمام حتى الآن.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <div className="table-container">
            <table className="w-full text-right whitespace-nowrap">
              <thead className="bg-[#FAF9F6] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 text-[13px] font-black tracking-wide text-primary">تاريخ الطلب</th>
                  <th className="px-6 py-5 text-[13px] font-black tracking-wide text-primary">التفاصيل</th>
                  <th className="px-6 py-5 text-[13px] font-black tracking-wide text-primary">الرياضة</th>
                  <th className="px-6 py-5 text-[13px] font-black tracking-wide text-primary text-center">التواصل</th>
                  <th className="px-6 py-5 text-[13px] font-black tracking-wide text-primary text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-[#F5F5F7] transition-all duration-300 ${lead.status === 'contacted' ? 'bg-[#FAF9F6]/80' : 'bg-white'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                        <Clock className="w-4 h-4 text-secondary" />
                        <span dir="ltr">{new Date(lead.createdAt || lead.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-primary text-lg mb-1">{lead.name}</span>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 font-bold" dir="ltr">
                          <Phone className="w-3.5 h-3.5" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-wide bg-secondary/10 text-secondary">
                        {lead.sportInterest || "غير محدد"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <a 
                          href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200 hover:-translate-y-1 transition-all shadow-sm"
                          title="مراسلة واتساب"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.474-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg> 
                        </a>
                        <a 
                          href={`tel:${lead.phone}`} 
                          className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 hover:text-blue-700 border border-blue-200 hover:-translate-y-1 transition-all shadow-sm"
                          title="اتصال هاتفي"
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleToggleStatus(lead.id, lead.status)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all shadow-sm hover:-translate-y-0.5 ${lead.status === 'contacted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' : 'bg-[#F5F5F7] text-gray-600 border border-gray-200 hover:bg-gray-200'}`}
                        >
                          {lead.status === 'contacted' ? (
                            <><CheckCircle2 className="w-4 h-4" /> تم التواصل</>
                          ) : (
                            <><Circle className="w-4 h-4" /> قيد المراجعة</>
                          )}
                        </button>
                        <button 
                          onClick={() => handleDelete(lead.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-full transition-all border border-transparent hover:border-red-100 hover:-translate-y-0.5"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
