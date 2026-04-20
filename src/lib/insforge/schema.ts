export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      Member: {
        Row: {
          id: string;
          fullNameArabic: string;
          fullNameEnglish: string | null;
          dateOfBirth: string | null;
          gender: "male" | "female" | "other" | null;
          phoneFather: string | null;
          phoneMother: string | null;
          notes: string | null;
          isSchoolProgram: boolean;
          isClubSon: boolean;
          nationalId: string | null;
          photoUrl: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database["public"]["Tables"]["Member"]["Row"], "id" | "createdAt" | "updatedAt"> & {
          id?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: Partial<Database["public"]["Tables"]["Member"]["Insert"]>;
      };
      Sport: {
        Row: {
          id: string;
          name: "Karate" | "Taekwondo" | "Gymnastics" | "Kickboxing" | "Judo" | "Wrestling" | "Arnis";
          isActive: boolean;
        };
        Insert: {
          id?: string;
          name: Database["public"]["Tables"]["Sport"]["Row"]["name"];
          isActive?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["Sport"]["Insert"]>;
      };
      SportsEnrollment: {
        Row: {
          id: string;
          memberId: string;
          sportId: string;
          subscriptionStart: string; // ISO Date String
          subscriptionEnd: string;
          monthlyFee: number;
          status: "active" | "expired" | "frozen" | "cancelled";
          timeSlot: string | null;
          notes: string | null;
          coachId: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["SportsEnrollment"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["SportsEnrollment"]["Insert"]>;
      };
      Attendance: {
        Row: {
          id: string;
          memberId: string;
          sportId: string;
          date: string;
          status: "present" | "absent" | "excused";
          source: "manual" | "imported" | null;
          comment: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["Attendance"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["Attendance"]["Insert"]>;
      };
      Payment: {
        Row: {
          id: string;
          memberId: string | null;
          sportId: string | null;
          date: string;
          endOfSubscriptionDate: string | null;
          paymentType: "subscription" | "belt" | "uniform" | "privateSession" | "other";
          category: "income" | "expense";
          method: "cash" | "transferATM" | "cardMachine" | "bankDeposit";
          amount: number;
          beltsUniformAmount: number | null;
          expensesAmount: number | null;
          bankAmount: number | null;
          description: string | null;
          phone: string | null;
          invoiceNumber: string | null;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["Payment"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["Payment"]["Insert"]>;
      };
      BeltTest: {
        Row: {
          id: string;
          memberId: string;
          sportId: string;
          date: string;
          beltLevelFrom: string;
          beltLevelTo: string;
          testFee: number;
          passed: boolean;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["BeltTest"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["BeltTest"]["Insert"]>;
      };
      Coach: {
        Row: {
          id: string;
          fullName: string;
          phone: string | null;
          sportId: string | null;
          baseSalary: number | null;
          CoachsalaryPercentage: number | null;
          note: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["Coach"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["Coach"]["Insert"]>;
      };
      CoachAttendance: {
        Row: {
          id: string;
          coachId: string;
          date: string;
          status: "present" | "absent" | "late" | "excused";
          notes: string | null;
          createdAt: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["CoachAttendance"]["Row"], "id" | "createdAt"> & { id?: string; createdAt?: string };
        Update: Partial<Database["public"]["Tables"]["CoachAttendance"]["Insert"]>;
      };
      SystemUser: {
        Row: {
          id: string;
          name: string;
          email: string;
          passwordHash: string;
          role: "admin" | "coach" | "accountant" | "receptionist";
          linkedCoachId: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["SystemUser"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["SystemUser"]["Insert"]>;
      };
    };
  };
}
