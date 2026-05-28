import bcrypt from "bcryptjs";
import type { PasswordOtpPurpose } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export const createOtp = async (userId: string, purpose: PasswordOtpPurpose) => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.passwordOtp.create({
    data: {
      userId,
      purpose,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return code;
};

export const consumeOtp = async (userId: string, purpose: PasswordOtpPurpose, code: string) => {
  const otp = await prisma.passwordOtp.findFirst({
    where: {
      userId,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || !(await bcrypt.compare(code, otp.codeHash))) {
    return false;
  }

  await prisma.passwordOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  return true;
};
