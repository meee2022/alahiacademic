import { insforge } from "./client";
import type { Database } from "./schema";

export type MemberWithEnrollments = Database["public"]["Tables"]["Member"]["Row"] & {
  SportsEnrollment: (Database["public"]["Tables"]["SportsEnrollment"]["Row"] & {
    Sport: Database["public"]["Tables"]["Sport"]["Row"] | null;
  })[];
};

export type PaymentWithMember = Database["public"]["Tables"]["Payment"]["Row"] & {
  Member: Database["public"]["Tables"]["Member"]["Row"] | null;
  Sport: Database["public"]["Tables"]["Sport"]["Row"] | null;
};

export async function getMembers(search?: string) {
  let query = insforge.database
    .from("Member")
    .select("*, SportsEnrollment(*, Sport(*))")
    .order("fullNameArabic", { ascending: true });

  if (search) {
    query = query.ilike("fullNameArabic", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as MemberWithEnrollments[];
}

export async function getPayments(limit = 100) {
  const { data, error } = await insforge.database
    .from("Payment")
    .select("*, Member(*), Sport(*)")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as PaymentWithMember[];
}

export async function getSports() {
  const { data, error } = await insforge.database
    .from("Sport")
    .select("*")
    .eq("isActive", true);

  if (error) throw error;
  return data;
}

export async function getAttendanceByDateAndSport(date: string, sportId: string) {
  const { data, error } = await insforge.database
    .from("Attendance")
    .select("*")
    .eq("date", date)
    .eq("sportId", sportId);

  if (error) throw error;
  return data;
}

export async function markAttendance(memberId: string, sportId: string, date: string, status: "present" | "absent" | "excused") {
  // Safe select-then-insert/update (avoids relying on unique constraint for upsert)
  const { data: existing, error: checkErr } = await insforge.database
    .from("Attendance")
    .select("id")
    .eq("memberId", memberId)
    .eq("sportId", sportId)
    .eq("date", date)
    .maybeSingle();

  if (checkErr) throw checkErr;

  if (existing?.id) {
    const { data, error } = await insforge.database
      .from("Attendance")
      .update({ status })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await insforge.database
      .from("Attendance")
      .insert({ memberId, sportId, date, status })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function getDashboardStats(date?: string) {
  const targetDate = date || new Date().toISOString().split("T")[0];

  const [membersCount, sportsCount, paymentsSum, enrollments, sportsData, attendanceData] = await Promise.all([
    insforge.database.from("Member").select("id", { count: "exact", head: true }),
    insforge.database.from("Sport").select("id", { count: "exact", head: true }),
    insforge.database.from("Payment").select("amount, category, date"),
    insforge.database.from("SportsEnrollment").select("sportId, Sport(name)"),
    insforge.database.from("Sport").select("id, name").eq("isActive", true),
    insforge.database.from("Attendance").select("status").like("date", `${targetDate}%`)
  ]);

  const payments = paymentsSum.data || [];
  const targetDatePayments = payments.filter(p => (p.date || "").startsWith(targetDate));
  
  const income = targetDatePayments.filter(p => p.category === "income").reduce((acc, p) => acc + (p.amount as number), 0);
  const expenses = targetDatePayments.filter(p => p.category === "expense").reduce((acc, p) => acc + (p.amount as number), 0);

  // Per-sport counts
  const sportCounts: Record<string, number> = {};
  (enrollments.data || []).forEach((en: any) => {
    const name = en.Sport?.name || "غير محدد";
    sportCounts[name] = (sportCounts[name] || 0) + 1;
  });

  // Monthly payments breakdown
  const monthlyData: Record<string, { income: number; expenses: number }> = {};
  payments.forEach((p: any) => {
    const month = p.date ? p.date.substring(0, 7) : "unknown"; // YYYY-MM
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
    if (p.category === "income") monthlyData[month].income += Number(p.amount);
    else monthlyData[month].expenses += Number(p.amount);
  });

  const attendanceRecords = attendanceData.data || [];
  const todayPresent = attendanceRecords.filter((a: any) => a.status === "present").length;
  const todayAbsent = attendanceRecords.filter((a: any) => a.status === "absent").length;

  return {
    membersCount: membersCount.count || 0,
    sportsCount: sportsCount.count || 0,
    totalIncome: income,
    totalExpenses: expenses,
    netProfit: income - expenses,
    sportCounts,
    monthlyData,
    sports: sportsData.data || [],
    todayPresent,
    todayAbsent
  };
}

export async function getMemberById(id: string) {
  const { data, error } = await insforge.database
    .from("Member")
    .select(`
      *,
      SportsEnrollment(*, Sport(*)),
      Payment(*, Sport(*)),
      Attendance(*, Sport(*))
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
export async function updateMember(id: string, updates: Partial<Database["public"]["Tables"]["Member"]["Update"]>) {
  const { data, error } = await insforge.database
    .from("Member")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function renewSubscription(
  enrollmentId: string,
  newEndDate: string,
  monthlyFee: number,
  payment: Partial<Database["public"]["Tables"]["Payment"]["Insert"]>
) {
  // 1. Update the enrollment
  const { data: updatedEnrollment, error: envError } = await insforge.database
    .from("SportsEnrollment")
    .update({ subscriptionEnd: newEndDate, status: 'active', monthlyFee })
    .eq("id", enrollmentId)
    .select()
    .single();

  if (envError) throw envError;

  // 2. Insert the payment record
  const { data: insertedPayment, error: paymentError } = await insforge.database
    .from("Payment")
    .insert([{ ...payment, paymentType: 'subscription', endOfSubscriptionDate: newEndDate }])
    .select()
    .single();

  if (paymentError) throw paymentError;

  return { updatedEnrollment, paymentId: insertedPayment?.id };
}

export async function assignOrUpdateSport(memberId: string, sportId: string) {
  const { data: existing } = await insforge.database
    .from("SportsEnrollment")
    .select("id")
    .eq("memberId", memberId)
    .limit(1);

  if (existing && existing.length > 0) {
    const { data, error } = await insforge.database
      .from("SportsEnrollment")
      .update({ sportId })
      .eq("id", existing[0].id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    const { data, error } = await insforge.database
      .from("SportsEnrollment")
      .insert({
        memberId,
        sportId,
        subscriptionStart: start.toISOString(),
        subscriptionEnd: end.toISOString(),
        monthlyFee: 0,
        status: "active"
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function getMemberSequentialNumber(memberId: string, createdAt: string) {
  const { count, error } = await insforge.database
    .from("Member")
    .select("id", { count: "exact", head: true })
    .lt("createdAt", createdAt);
  
  if (error) throw error;
  return 100 + (count || 0);
}

export async function deleteMember(memberId: string) {
  // Delete related records first to avoid foreign key constraints failing
  await Promise.all([
    insforge.database.from("Attendance").delete().eq("memberId", memberId),
    insforge.database.from("BeltTest").delete().eq("memberId", memberId),
    insforge.database.from("SportsEnrollment").delete().eq("memberId", memberId),
    insforge.database.from("Payment").delete().eq("memberId", memberId)
  ]);

  const { error } = await insforge.database.from("Member").delete().eq("id", memberId);
  if (error) throw error;
}

export async function deleteSubscription(enrollmentId: string) {
  const { error } = await insforge.database.from("SportsEnrollment").delete().eq("id", enrollmentId);
  if (error) throw error;
}
