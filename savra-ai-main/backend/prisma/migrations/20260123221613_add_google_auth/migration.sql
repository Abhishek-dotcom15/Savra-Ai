-- AlterTable: Make password_hash nullable for Google auth users
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable: Add google_id column
ALTER TABLE "users" ADD COLUMN "google_id" TEXT;

-- CreateIndex: Make google_id unique
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
