CREATE TABLE IF NOT EXISTS "AppUser" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "fullName" TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  phone TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "CoachAttendance" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "coachId" UUID NOT NULL REFERENCES "Coach"(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("coachId", date)
);

INSERT INTO "AppUser" (email, "fullName", role, "isActive")
VALUES ('eng.mohamed87@live.com', 'المدير العام', 'admin', true)
ON CONFLICT (email) DO NOTHING;
