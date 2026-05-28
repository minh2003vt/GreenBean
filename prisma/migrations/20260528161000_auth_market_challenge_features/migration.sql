ALTER TYPE "StepMediaType" ADD VALUE IF NOT EXISTS 'AUDIO';

CREATE TYPE "PasswordOtpPurpose" AS ENUM ('PASSWORD_RESET', 'PASSWORD_CHANGE');
CREATE TYPE "UserChallengePictureKind" AS ENUM ('BEFORE', 'AFTER', 'PROGRESS');
CREATE TYPE "ChallengeReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "users" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';

CREATE TABLE "password_otps" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "code_hash" TEXT NOT NULL,
  "purpose" "PasswordOtpPurpose" NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "password_otps_user_id_purpose_expires_at_idx"
  ON "password_otps"("user_id", "purpose", "expires_at");

CREATE TABLE "cart_items" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cart_items_user_id_product_id_key" ON "cart_items"("user_id", "product_id");

ALTER TABLE "user_challenges"
  ADD COLUMN "review_status" "ChallengeReviewStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "review_note" TEXT,
  ADD COLUMN "is_winner" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reward_paid_at" TIMESTAMP(3);

ALTER TABLE "user_challenge_pictures"
  ADD COLUMN "kind" "UserChallengePictureKind" NOT NULL DEFAULT 'PROGRESS',
  ADD COLUMN "ai_review" TEXT,
  ADD COLUMN "ai_is_relevant" BOOLEAN,
  ADD COLUMN "ai_is_fresh" BOOLEAN;

ALTER TABLE "password_otps"
  ADD CONSTRAINT "password_otps_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
