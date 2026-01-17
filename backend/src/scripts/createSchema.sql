-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CONNECTOR', 'SMALL_GROUP_LEADER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContactSource" AS ENUM ('SUNDAY_SERVICE', 'COMMUNITY_EVENT', 'CAFE', 'WEBSITE', 'INSTAGRAM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContactClassification" AS ENUM ('VIP_CHRISTIAN', 'NAME_CHRISTIAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'ALREADY_IN_SMALL_GROUP', 'CONTACT_ENDED', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "WorkflowWeek" AS ENUM ('WEEK_1', 'WEEK_2', 'WEEK_3', 'WEEK_4');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TrackingFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Contact table
CREATE TABLE IF NOT EXISTS "Contact" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    district TEXT,
    area TEXT,
    source "ContactSource" NOT NULL,
    classification "ContactClassification" NOT NULL,
    "registeredForSmallGroup" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "creatorId" TEXT,
    "smallGroupId" TEXT,
    CONSTRAINT "Contact_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"(id) ON DELETE SET NULL
);

-- Create SmallGroupLeader table
CREATE TABLE IF NOT EXISTS "SmallGroupLeader" (
    id TEXT PRIMARY KEY,
    "userId" TEXT UNIQUE NOT NULL,
    whatsapp TEXT,
    "groupName" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "SmallGroupLeader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create WorkflowProgress table
CREATE TABLE IF NOT EXISTS "WorkflowProgress" (
    id TEXT PRIMARY KEY,
    "contactId" TEXT UNIQUE NOT NULL,
    "currentWeek" "WorkflowWeek" NOT NULL DEFAULT 'WEEK_1',
    "startDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    completed BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "WorkflowProgress_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"(id) ON DELETE CASCADE
);

-- Create Task table
CREATE TABLE IF NOT EXISTS "Task" (
    id TEXT PRIMARY KEY,
    "workflowProgressId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    week "WorkflowWeek" NOT NULL,
    "taskType" TEXT NOT NULL,
    description TEXT NOT NULL,
    "dueDate" TIMESTAMP NOT NULL,
    status "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP,
    notes TEXT,
    "communicationMethod" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "Task_workflowProgressId_fkey" FOREIGN KEY ("workflowProgressId") REFERENCES "WorkflowProgress"(id) ON DELETE CASCADE,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"(id) ON DELETE RESTRICT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");
CREATE INDEX IF NOT EXISTS "Task_workflowProgressId_idx" ON "Task"("workflowProgressId");
CREATE INDEX IF NOT EXISTS "KPIRecord_kpiId_date_idx" ON "KPIRecord"("kpiId", "date");

-- Add foreign key constraint for Contact.smallGroupId if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Contact_smallGroupId_fkey'
    ) THEN
        ALTER TABLE "Contact" 
        ADD CONSTRAINT "Contact_smallGroupId_fkey" 
        FOREIGN KEY ("smallGroupId") REFERENCES "SmallGroupLeader"(id) ON DELETE SET NULL;
    END IF;
END $$;
