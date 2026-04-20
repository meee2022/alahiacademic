"use client";

import { useState, useEffect } from "react";
import { insforge } from "@/lib/insforge/client";
import { 
  Package, Plus, Search, Edit2, Trash2, X, Save, TrendingUp, DollarSign, Box, Percent,
  ListOrdered
} from "lucide-react";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "sales">("inventory");
  
  const [items, setItems] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Sell Modal state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingItem, setSellingItem] = useState<any>(null);
  const [sellFormData, setSellFormData] = useState({
    quantity: "1",
    actualPrice: ""
  });
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    costPrice: "",
    sellingPrice: "",
    quantity: ""
  });

  const predefinedSizes = ["S", "M", "L", "XL", "XXL"];

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge.database
        .from("InventoryItem")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        // Table might not exist yet, ignore error silently while building
        console.error("Error fetching inventory:", error);
      } else if (data) {
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      setLoadingSales(true);
      const { data, error } = await insforge.database
        .from("InventorySale")
        .select(`
          *,
          item:InventoryItem (name, size, costPrice)
        `)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching sales:", error);
      } else if (data) {
        setSales(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchSales();
  }, []);

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        size: item.size || "",
        costPrice: item.costPrice.toString(),
        sellingPrice: item.sellingPrice.toString(),
        quantity: item.quantity.toString()
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        size: "",
        costPrice: "",
        sellingPrice: "",
        quantity: ""
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.costPrice || !formData.sellingPrice || !formData.quantity) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    const itemData = {
      name: formData.name,
      size: formData.size,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      quantity: parseInt(formData.quantity, 10),
    };

    try {
      if (editingItem) {
        const { error } = await insforge.database
          .from("InventoryItem")
          .update(itemData)
          .eq("id", editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await insforge.database
          .from("InventoryItem")
          .insert([itemData]);
          
        if (error) throw error;
      }
      
      await fetchInventory();
      closeModal();
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ. تأكد من إنشاء جدول InventoryItem");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      const { error } = await insforge.database
        .from("InventoryItem")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await fetchInventory();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const openSellModal = (item: any) => {
    setSellingItem(item);
    setSellFormData({
      quantity: "1",
      actualPrice: item.sellingPrice.toString()
    });
    setIsSellModalOpen(true);
  };

  const closeSellModal = () => {
    setIsSellModalOpen(false);
    setSellingItem(null);
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingItem || !sellFormData.quantity || !sellFormData.actualPrice) return;

    const qtyToSell = parseInt(sellFormData.quantity, 10);
    const actualPriceToSell = parseFloat(sellFormData.actualPrice);

    if (qtyToSell <= 0 || qtyToSell > sellingItem.quantity) {
      alert("الكمية غير صحيحة. يرجى التأكد من توفر كمية كافية في المخزن.");
      return;
    }

    setSaving(true);
    try {
      // 1. Insert into InventorySale
      const { error: saleError } = await insforge.database
        .from("InventorySale")
        .insert([{
          item_id: sellingItem.id,
          quantity: qtyToSell,
          actual_price: actualPriceToSell
        }]);

      if (saleError) throw saleError;

      // 2. Decrement quantity in InventoryItem
      const newQty = sellingItem.quantity - qtyToSell;
      const { error: updateError } = await insforge.database
        .from("InventoryItem")
        .update({ quantity: newQty })
        .eq("id", sellingItem.id);

      if (updateError) throw updateError;

      await fetchInventory();
      await fetchSales();
      closeSellModal();
      alert("تم تسجيل البيع بنجاح!");
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء تسجيل البيع. تأكد من إنشاء جدول InventorySale");
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const totalItemsCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalCostValue = items.reduce((sum, item) => sum + ((item.costPrice || 0) * (item.quantity || 0)), 0);
  const totalSalesValue = items.reduce((sum, item) => sum + ((item.sellingPrice || 0) * (item.quantity || 0)), 0);
  const expectedProfit = totalSalesValue - totalCostValue;

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.size && item.size.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-tertiary rounded-[28px] p-8 text-white relative overflow-hidden shadow-xl flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-white/50 text-[11px] font-bold tracking-[0.2em] uppercase mb-2">لوحة التحكم</p>
          <h1 className="text-3xl font-black">المخزن الأساسي</h1>
          <p className="text-white/60 text-sm font-medium mt-1">إدارة مخزون الملابس والأدوات الرياضية وحساب التكاليف والأرباح</p>
        </div>
        <div className="w-16 h-16 rounded-[20px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 relative z-10 shrink-0 hidden md:flex">
          <Package className="w-8 h-8 text-secondary" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100/80 flex flex-col transition-all hover:-translate-y-1 hover:shadow-md cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Box className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">إجمالي المنتجات</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-primary">{totalItemsCount}</h3>
            <p className="text-xs font-bold text-gray-500">قطعة متوفرة حالياً بالمنشأة</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100/80 flex flex-col transition-all hover:-translate-y-1 hover:shadow-md cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">إجمالي تكلفة المخزون</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-primary">{totalCostValue.toLocaleString()} ر.ق</h3>
            <p className="text-xs font-bold text-gray-500">مجموع أسعار الشراء من المصنع</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100/80 flex flex-col transition-all hover:-translate-y-1 hover:shadow-md cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">توقعات المبيعات الحالية</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-tertiary">{totalSalesValue.toLocaleString()} ر.ق</h3>
            <p className="text-xs font-bold text-gray-500">القيمة الإجمالية في حال بيع الكل</p>
          </div>
        </div>

        <div className="bg-primary text-white rounded-[24px] p-6 shadow-lg shadow-primary/20 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl cursor-default relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-secondary">
              <Percent className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-white/70 bg-black/20 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">الأرباح المتوقعة</span>
          </div>
          <div className="space-y-1 relative z-10">
            <h3 className="text-3xl font-black text-secondary">{expectedProfit.toLocaleString()} ر.ق</h3>
            <p className="text-xs font-bold text-white/60">صافي الأرباح للمخزون المتبقي</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 max-w-fit mt-4">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "inventory" ? "bg-primary text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          <Box className="w-4 h-4" />
          مخزون المنتجات
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "sales" ? "bg-primary text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
        >
          <ListOrdered className="w-4 h-4" />
          سجل المبيعات
        </button>
      </div>

      {activeTab === "inventory" ? (
        <>
          {/* Action Bar & Search */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[24px] p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between mt-6">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 right-0 px-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-2xl border-0 py-3.5 pr-11 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary font-medium transition-all"
            placeholder="ابحث عن منتج بالاسم أو المقاس..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-tertiary text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md shadow-primary/20 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          إضافة بضاعة جديدة
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[28px] shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-100">
                <th className="py-5 px-6 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider w-[30%]">الاسم والمقاس</th>
                <th className="py-5 px-4 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-center">التكلفة للقطعة</th>
                <th className="py-5 px-4 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-center">سعر البيع</th>
                <th className="py-5 px-4 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-center">الكمية</th>
                <th className="py-5 px-4 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-center">الربح الصافي</th>
                <th className="py-5 px-6 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-center w-[15%]">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">جاري التحميل...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                      <Package className="w-12 h-12 opacity-20" />
                      <span className="font-medium text-lg">لا توجد منتجات مطابقة في المخزن</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors group">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          <Box className="w-5 h-5 text-primary/50" />
                        </div>
                        <div>
                          <div className="font-bold text-tertiary text-[15px]">{item.name}</div>
                          {item.size && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest bg-gray-100 text-gray-500">
                              المقاس: {item.size}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className="font-bold text-gray-600">{item.costPrice} ر.ق</span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className="font-black text-primary">{item.sellingPrice} ر.ق</span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-black text-sm ${
                        item.quantity === 0 ? 'bg-rose-100 text-rose-600' : 
                        item.quantity < 5 ? 'bg-amber-100 text-amber-600' : 
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-emerald-600 text-sm">+{item.sellingPrice - item.costPrice} ر.ق</span>
                        <span className="text-[10px] text-gray-400 font-bold mt-0.5">للقطعة</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => openSellModal(item)}
                          disabled={item.quantity === 0}
                          className="px-3 h-9 flex items-center justify-center gap-1 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 font-bold text-xs transition-all border border-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="بيع / صرف"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>بيع</span>
                        </button>
                        <button 
                          onClick={() => openModal(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100 shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all border border-gray-100 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : (
        <div className="bg-white rounded-[28px] shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-gray-100/50 overflow-hidden mt-6">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-lg font-black text-primary">سجل المبيعات والأرباح الحقيقية</h2>
              <p className="text-gray-500 text-xs font-bold mt-1">يعرض السعر الفعلي الذي تم بيع القطع به.</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">إجمالي الأرباح الفعلية:</span>
              <span className="font-black text-emerald-600">
                {sales.reduce((sum, sale) => sum + ((sale.actual_price - (sale.item?.costPrice || 0)) * sale.quantity), 0).toLocaleString()} ر.ق
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-gray-100">
                  <th className="py-5 px-6 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider w-[35%]">المنتج المُباع</th>
                  <th className="py-5 px-4 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-center">الكمية</th>
                  <th className="py-5 px-4 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-center">السعر الفعلي للإجمالي</th>
                  <th className="py-5 px-4 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-center">صافي الربح المُحقق</th>
                  <th className="py-5 px-6 font-black text-tertiary text-sm whitespace-nowrap uppercase tracking-wider text-left">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {loadingSales ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">جاري التحميل...</td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16">
                      <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                        <TrendingUp className="w-12 h-12 opacity-20" />
                        <span className="font-medium text-lg">لم يتم تسجيل أي مبيعات حتى الآن</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => {
                    const itemCost = sale.item?.costPrice || 0;
                    const totalActualRevenue = sale.actual_price * sale.quantity;
                    const totalCost = itemCost * sale.quantity;
                    const actualProfit = totalActualRevenue - totalCost;

                    return (
                      <tr key={sale.id} className="hover:bg-[#FDFDFD] transition-colors group">
                        <td className="py-5 px-6">
                          <div className="font-bold text-tertiary text-[15px]">{sale.item?.name || "منتج محذوف"}</div>
                          {sale.item?.size && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest bg-gray-100 text-gray-500">
                              المقاس: {sale.item.size}
                            </span>
                          )}
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-black text-sm bg-blue-50 text-blue-600">
                            {sale.quantity}
                          </span>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className="font-black text-primary">{totalActualRevenue} ر.ق</span>
                          {sale.quantity > 1 && (
                            <div className="text-[10px] text-gray-400 font-bold mt-0.5">القطعة بـ {sale.actual_price} ر.ق</div>
                          )}
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className="font-black text-emerald-600 text-sm">+{actualProfit} ر.ق</span>
                        </td>
                        <td className="py-5 px-6 text-left" dir="ltr">
                          <span className="text-xs font-bold text-gray-500">
                            {new Date(sale.created_at).toLocaleString("ar-SA", { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute:'2-digit'
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-tertiary px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black">{editingItem ? "تعديل المنتج" : "إضافة بضاعة جديدة للمخزن"}</h2>
                <p className="text-white/60 text-xs font-bold mt-1">
                  {editingItem ? "قم بتعديل الكميات أو الأسعار بدقة" : "سجل صنف جديد مع أسعار التكلفة للبيع"}
                </p>
              </div>
              <button onClick={closeModal} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">اسم الملابس / الأداة <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="مثال: بدلة كاراتيه ماركة Arawaza"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-4 text-sm font-bold text-tertiary focus:bg-white focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">المقاس (اختياري)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {predefinedSizes.map(size => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => setFormData({...formData, size})}
                      className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all border ${
                        formData.size === size 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="أو اكتب مقاساً خاصاً (مثال: أطفال مقاس 2)"
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-3 text-sm font-bold text-tertiary focus:bg-white focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">سعر المصنع <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                      className="w-full bg-[#FDF8F9] rounded-2xl px-5 py-4 pl-12 text-sm font-black text-primary focus:bg-white focus:ring-2 focus:ring-primary/20 border border-primary/10 focus:border-primary/30 outline-none transition-all"
                      dir="ltr"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 pointer-events-none">ر.ق</div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">سعر البيع <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                      className="w-full bg-emerald-50/50 rounded-2xl px-5 py-4 pl-12 text-sm font-black text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 border border-emerald-500/10 focus:border-emerald-500/30 outline-none transition-all"
                      dir="ltr"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 pointer-events-none">ر.ق</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">الكمية المتوفرة <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-4 text-sm font-black text-tertiary focus:bg-white focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 outline-none transition-all"
                  dir="ltr"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-tertiary text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                  {saving ? "جاري الحفظ..." : (
                    <>
                      <Save className="w-4 h-4" />
                      حفظ بيانات المنتج
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-1/3 py-4 rounded-2xl font-black text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {isSellModalOpen && sellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSellModal}></div>
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1a365d] px-8 py-6 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-black">تسجيل عملية بيع</h2>
                <p className="text-white/80 text-xs font-bold mt-1">
                  بيع "{sellingItem.name}"
                </p>
              </div>
              <button onClick={closeSellModal} className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <form onSubmit={handleSell} className="p-8 space-y-6">
              
              <div className="bg-blue-50/50 rounded-2xl p-4 flex justify-between items-center border border-blue-100/50">
                <span className="text-xs font-black text-blue-800">الكمية المتوفرة حالياً بالمنشأة</span>
                <span className="font-black text-blue-600 bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm">{sellingItem.quantity} قطعة</span>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">الكمية المباعة <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  min="1"
                  max={sellingItem.quantity}
                  value={sellFormData.quantity}
                  onChange={(e) => setSellFormData({...sellFormData, quantity: e.target.value})}
                  className="w-full bg-[#F5F5F7] rounded-2xl px-5 py-4 text-sm font-black text-tertiary focus:bg-white focus:ring-2 focus:ring-[#1a365d]/20 border border-transparent focus:border-[#1a365d]/30 outline-none transition-all"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">السعر الفعلي للقطعة <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellFormData.actualPrice}
                    onChange={(e) => setSellFormData({...sellFormData, actualPrice: e.target.value})}
                    className="w-full bg-emerald-50/50 rounded-2xl px-5 py-4 pl-12 text-sm font-black text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 border border-emerald-500/10 focus:border-emerald-500/30 outline-none transition-all"
                    dir="ltr"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 pointer-events-none">ر.ق</div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="submit"
                  disabled={saving || !sellFormData.quantity || parseInt(sellFormData.quantity) > sellingItem.quantity}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1a365d] hover:bg-[#0d1b2a] text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#1a365d]/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                  {saving ? "جاري الحفظ..." : "تأكيد البيع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
