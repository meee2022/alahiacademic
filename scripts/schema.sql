CREATE TABLE IF NOT EXISTS "Member" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "fullNameArabic" TEXT NOT NULL,
  "fullNameEnglish" TEXT,
  "dateOfBirth" DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  "phoneFather" TEXT,
  "phoneMother" TEXT,
  notes TEXT,
  "isSchoolProgram" BOOLEAN DEFAULT false,
  "isClubSon" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Sport" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (name IN ('Karate', 'Taekwondo', 'Gymnastics', 'Kickboxing', 'Judo', 'Wrestling', 'Arnis')),
  "isActive" BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS "SportsEnrollment" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "memberId" UUID NOT NULL REFERENCES "Member"(id) ON DELETE CASCADE,
  "sportId" UUID NOT NULL REFERENCES "Sport"(id),
  "subscriptionStart" DATE NOT NULL,
  "subscriptionEnd" DATE NOT NULL,
  "monthlyFee" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'frozen', 'cancelled')),
  "timeSlot" TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS "Attendance" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "memberId" UUID NOT NULL REFERENCES "Member"(id) ON DELETE CASCADE,
  "sportId" UUID NOT NULL REFERENCES "Sport"(id),
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'imported')),
  comment TEXT
);

CREATE TABLE IF NOT EXISTS "Payment" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "memberId" UUID REFERENCES "Member"(id),
  "sportId" UUID REFERENCES "Sport"(id),
  date DATE NOT NULL,
  "endOfSubscriptionDate" DATE,
  "paymentType" TEXT NOT NULL DEFAULT 'other' CHECK ("paymentType" IN ('subscription', 'belt', 'uniform', 'privateSession', 'other')),
  category TEXT NOT NULL DEFAULT 'income' CHECK (category IN ('income', 'expense')),
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'transferATM', 'cardMachine', 'bankDeposit')),
  amount NUMERIC NOT NULL DEFAULT 0,
  "beltsUniformAmount" NUMERIC,
  "expensesAmount" NUMERIC,
  "bankAmount" NUMERIC,
  description TEXT,
  phone TEXT,
  "invoiceNumber" TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS "BeltTest" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "memberId" UUID NOT NULL REFERENCES "Member"(id) ON DELETE CASCADE,
  "sportId" UUID NOT NULL REFERENCES "Sport"(id),
  date DATE NOT NULL,
  "beltLevelFrom" TEXT NOT NULL,
  "beltLevelTo" TEXT NOT NULL,
  "testFee" NUMERIC NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS "Coach" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  phone TEXT,
  "sportId" UUID REFERENCES "Sport"(id),
  "baseSalary" NUMERIC,
  "CoachsalaryPercentage" NUMERIC DEFAULT 0,
  note TEXT
);

CREATE TABLE IF NOT EXISTS "CoachSalaryRecord" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "coachId" UUID NOT NULL REFERENCES "Coach"(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  "salaryAmount" NUMERIC NOT NULL DEFAULT 0,
  bonuses NUMERIC DEFAULT 0,
  penalties NUMERIC DEFAULT 0,
  "finalPaid" NUMERIC NOT NULL DEFAULT 0,
  "paymentMethod" TEXT DEFAULT 'cash' CHECK ("paymentMethod" IN ('cash', 'transfer')),
  "paidDate" DATE
);

CREATE TABLE IF NOT EXISTS "CoachAttendance" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "coachId" UUID NOT NULL REFERENCES "Coach"(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  UNIQUE("coachId", date)
);

CREATE TABLE IF NOT EXISTS "Lead" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  "sportInterest" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

INSERT INTO "Sport" (name, "isActive") VALUES
  ('Karate', true),
  ('Taekwondo', true),
  ('Gymnastics', true),
  ('Kickboxing', true),
  ('Judo', true),
  ('Wrestling', true),
  ('Arnis', true)
ON CONFLICT DO NOTHING;
