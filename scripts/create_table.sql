CREATE TABLE IF NOT EXISTS "MemberDocument" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "memberId" UUID REFERENCES "Member"(id) ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "fileSize" BIGINT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
