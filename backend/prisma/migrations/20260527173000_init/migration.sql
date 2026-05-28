CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "ProductApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'COMPLETED');
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED');
CREATE TYPE "UserChallengeProgressStatus" AS ENUM ('JOINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "StepMediaType" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "region" TEXT,
  "main_crop" TEXT,
  "avatar_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "problems" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "steps" (
  "id" UUID NOT NULL,
  "problem_id" UUID NOT NULL,
  "step_number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  CONSTRAINT "steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "step_media" (
  "id" UUID NOT NULL,
  "step_id" UUID NOT NULL,
  "media_type" "StepMediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "duration_sec" INTEGER,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "step_media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
  "id" UUID NOT NULL,
  "submitted_by" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "suggested_price" DECIMAL(12,2) NOT NULL,
  "thumbnail_url" TEXT,
  "approval_status" "ProductApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "admin_note" TEXT,
  "approved_by" UUID,
  "approved_at" TIMESTAMP(3),
  "admin_price" DECIMAL(12,2),
  "listing_price" DECIMAL(12,2),
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" UUID NOT NULL,
  "buyer_id" UUID NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "total_amount" DECIMAL(12,2) NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(12,2) NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "challenges" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "reward_label" TEXT NOT NULL,
  "reward_amount" DECIMAL(12,2) NOT NULL,
  "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_challenges" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "challenge_id" UUID NOT NULL,
  "progress_status" "UserChallengeProgressStatus" NOT NULL DEFAULT 'JOINED',
  "progress_pct" INTEGER NOT NULL DEFAULT 0,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "note" TEXT,
  CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_challenge_pictures" (
  "id" UUID NOT NULL,
  "user_challenge_id" UUID NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_challenge_pictures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");
CREATE UNIQUE INDEX "steps_problem_id_step_number_key" ON "steps"("problem_id", "step_number");
CREATE UNIQUE INDEX "user_challenges_user_id_challenge_id_key" ON "user_challenges"("user_id", "challenge_id");

ALTER TABLE "steps" ADD CONSTRAINT "steps_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "step_media" ADD CONSTRAINT "step_media_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_challenge_pictures" ADD CONSTRAINT "user_challenge_pictures_user_challenge_id_fkey" FOREIGN KEY ("user_challenge_id") REFERENCES "user_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
