import { ProductApprovalStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { getPagination, paginationQuerySchema } from "../lib/pagination.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/error-handler.js";
import { validate } from "../middleware/validate.js";

const productQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ProductApprovalStatus).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
  mine: z.coerce.boolean().optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().int().positive(),
  suggestedPrice: z.number().nonnegative(),
  thumbnailUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(3).optional(),
});

const approvalParamsSchema = z.object({ id: z.string().uuid() });
const productParamsSchema = z.object({ id: z.string().uuid() });
const updateProductSchema = createProductSchema.partial();

const approveProductSchema = z.object({
  approvalStatus: z.nativeEnum(ProductApprovalStatus),
  adminNote: z.string().optional(),
  isActive: z.boolean().optional(),
});

const listProductSchema = z.object({
  listingPrice: z.number().positive(),
  isActive: z.boolean().default(true),
});

export const productRouter = Router();

productRouter.get(
  "/",
  validate(productQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof productQuerySchema>;
    const { skip, take, page, limit } = getPagination(query);
    const isAdmin = req.user?.role === "ADMIN";
    const where = {
      approvalStatus: isAdmin ? query.status : "APPROVED" as const,
      category: query.category,
      isActive: isAdmin ? query.active : true,
      submittedById: query.mine && req.user ? req.user.id : req.user && !isAdmin ? { not: req.user.id } : undefined,
      name: query.search ? { contains: query.search, mode: "insensitive" as const } : undefined,
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          submittedBy: { select: { id: true, name: true, avatarUrl: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ items, meta: { page, limit, total } });
  }),
);

productRouter.get(
  "/submissions",
  requireAuth,
  requireAdmin,
  validate(productQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof productQuerySchema>;
    const { skip, take, page, limit } = getPagination(query);
    const where = { approvalStatus: query.status, category: query.category };
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { submittedBy: true } }),
      prisma.product.count({ where }),
    ]);
    res.json({ items, meta: { page, limit, total } });
  }),
);

productRouter.post(
  "/",
  requireAuth,
  validate(createProductSchema),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.create({
      data: { ...(req.body as z.infer<typeof createProductSchema>), submittedById: req.user!.id },
    });
    res.status(201).json(product);
  }),
);

productRouter.patch(
  "/:id",
  requireAuth,
  validate(productParamsSchema, "params"),
  validate(updateProductSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof productParamsSchema>;
    const product = await prisma.product.findUniqueOrThrow({ where: { id } });
    const canEdit = req.user!.role === "ADMIN" || product.submittedById === req.user!.id;
    if (!canEdit) throw new ApiError(403, "You cannot update this product");

    const userEditResetsApproval = req.user!.role !== "ADMIN" && product.approvalStatus !== "PENDING";
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(req.body as z.infer<typeof updateProductSchema>),
        approvalStatus: userEditResetsApproval ? "PENDING" : undefined,
        approvedById: userEditResetsApproval ? null : undefined,
        approvedAt: userEditResetsApproval ? null : undefined,
        adminNote: userEditResetsApproval ? null : undefined,
        adminPrice: userEditResetsApproval ? null : undefined,
        listingPrice: userEditResetsApproval ? null : undefined,
        isActive: userEditResetsApproval ? false : undefined,
      },
    });

    res.json(updated);
  }),
);

productRouter.delete(
  "/:id",
  requireAuth,
  validate(productParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof productParamsSchema>;
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    const canDelete = req.user!.role === "ADMIN" || product.submittedById === req.user!.id;
    if (!canDelete) throw new ApiError(403, "You cannot delete this product");
    if (product._count.orderItems > 0) throw new ApiError(400, "Product cannot be deleted because it has been purchased");

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  }),
);

productRouter.patch(
  "/:id/approval",
  requireAuth,
  requireAdmin,
  validate(approvalParamsSchema, "params"),
  validate(approveProductSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof approvalParamsSchema>;
    const body = req.body as z.infer<typeof approveProductSchema>;
    const isApproved = body.approvalStatus === "APPROVED";
    const existing = await prisma.product.findUniqueOrThrow({ where: { id } });
    const product = await prisma.product.update({
      where: { id },
      data: {
        approvalStatus: body.approvalStatus,
        adminNote: body.adminNote,
        approvedById: isApproved ? req.user!.id : null,
        approvedAt: isApproved ? new Date() : null,
        adminPrice: isApproved ? existing.suggestedPrice : null,
        listingPrice: null,
        isActive: false,
      },
    });

    res.json(product);
  }),
);

productRouter.patch(
  "/:id/listing",
  requireAuth,
  requireAdmin,
  validate(productParamsSchema, "params"),
  validate(listProductSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof productParamsSchema>;
    const body = req.body as z.infer<typeof listProductSchema>;
    const existing = await prisma.product.findUniqueOrThrow({ where: { id } });
    if (existing.approvalStatus !== "APPROVED") {
      throw new ApiError(400, "Only approved products can be listed");
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        listingPrice: body.listingPrice,
        isActive: body.isActive,
      },
    });

    res.json(product);
  }),
);
