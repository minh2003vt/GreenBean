import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("GreenBean@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@greenbean.local" },
    update: {},
    create: {
      name: "GreenBean Admin",
      email: "admin@greenbean.local",
      phone: "0900000000",
      passwordHash,
      role: "ADMIN",
    },
  });

  const farmer = await prisma.user.upsert({
    where: { email: "farmer@greenbean.local" },
    update: {},
    create: {
      name: "Nguyen Van A",
      email: "farmer@greenbean.local",
      phone: "0912345678",
      passwordHash,
      role: "USER",
    },
  });

  await prisma.problem.upsert({
    where: { slug: "vang-la-ca-phe" },
    update: {},
    create: {
      title: "Vang la ca phe",
      slug: "vang-la-ca-phe",
      description: "Huong dan nhan biet va xu ly tinh trang vang la tren cay ca phe.",
      thumbnailUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e",
      sortOrder: 1,
      steps: {
        create: [
          {
            stepNumber: 1,
            title: "Kiem tra la va dat",
            description: "Quan sat mau la, do am dat va dau hieu nam benh quanh goc.",
            media: {
              create: [
                {
                  mediaType: "IMAGE",
                  url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
                  title: "Mau la can quan sat",
                },
              ],
            },
          },
          {
            stepNumber: 2,
            title: "Bo sung dinh duong",
            description: "Bon phan huu co hoai muc va dieu chinh luong nuoc theo do am dat.",
          },
        ],
      },
    },
  });

  await prisma.product.createMany({
    data: [
      {
        submittedById: farmer.id,
        name: "Ca phe nhan xanh",
        description: "Ca phe nhan xanh phoi tu nhien.",
        category: "coffee",
        unit: "kg",
        quantity: 100,
        suggestedPrice: 65000,
        approvalStatus: "APPROVED",
        approvedById: admin.id,
        approvedAt: new Date(),
        adminPrice: 65000,
        listingPrice: 68000,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.challenge.create({
    data: {
      title: "Cham soc vuon sach 7 ngay",
      detail: "Ghi lai qua trinh cham soc vuon bang hinh anh trong 7 ngay lien tiep.",
      rewardLabel: "Diem thuong",
      rewardAmount: 100,
      status: "ACTIVE",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-06-30"),
      createdById: admin.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
