ALTER TABLE "users"
  ADD COLUMN "block_reason" TEXT,
  ADD COLUMN "blocked_until" TIMESTAMP(3);

ALTER TABLE "challenges"
  DROP COLUMN "reward_label",
  DROP COLUMN "reward_amount";
