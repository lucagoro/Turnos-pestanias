-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "mpPreferenceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleBlock" ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL;
