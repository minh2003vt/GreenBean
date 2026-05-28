import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { getPagination, paginationQuerySchema } from "../lib/pagination.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/error-handler.js";
import { validate } from "../middleware/validate.js";
import { capturePayPalOrder, createPayPalOrder } from "../services/paypal.service.js";

const createOrderSchema = z.object({
  note: z.string().optional(),
  fromCart: z.boolean().default(false),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() })).optional(),
}).refine((value) => value.fromCart || (value.items?.length ?? 0) > 0, "fromCart or items is required");
const orderParamsSchema = z.object({ id: z.string().uuid() });
const paypalCaptureSchema = z.object({ paypalOrderId: z.string().min(1) });

const buildOrderFromCart = async (userId: string, note?: string) => {
  const requestedItems = (await prisma.cartItem.findMany({ where: { userId } })).map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  return buildOrder(userId, requestedItems, true, note);
};

const buildOrder = async (
  userId: string,
  requestedItems: Array<{ productId: string; quantity: number }>,
  fromCart: boolean,
  note?: string,
) => {
  if (requestedItems.length === 0) throw new ApiError(400, "Cart is empty");

  const productIds = requestedItems.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, approvalStatus: "APPROVED" },
  });

  if (products.length !== new Set(productIds).size) {
    throw new ApiError(400, "One or more products are not available");
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const orderItems = requestedItems.map((item) => {
    const product = productById.get(item.productId);
    if (!product) throw new ApiError(400, "Product not found");
    if (item.quantity > product.quantity) {
      throw new ApiError(400, `${product.name} only has ${product.quantity} ${product.unit} in stock`);
    }
    const unitPrice = product.listingPrice ?? product.suggestedPrice;
    const subtotal = new Prisma.Decimal(unitPrice).mul(item.quantity);
    return { productId: item.productId, quantity: item.quantity, unitPrice, subtotal };
  });

  const totalAmount = orderItems.reduce((total, item) => total.add(item.subtotal), new Prisma.Decimal(0));

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId: userId,
        note,
        totalAmount,
        items: { create: orderItems },
      },
      include: { items: true },
    });

      if (fromCart) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      await Promise.all(
        orderItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          }),
        ),
      );

      return created;
    });

  return order;
};

const getCartTotal = async (userId: string) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  if (cartItems.length === 0) throw new ApiError(400, "Cart is empty");

  return cartItems.reduce((total, item) => {
    if (!item.product.isActive || item.product.approvalStatus !== "APPROVED") {
      throw new ApiError(400, "One or more products are not available");
    }
    if (item.quantity > item.product.quantity) {
      throw new ApiError(400, `${item.product.name} only has ${item.product.quantity} ${item.product.unit} in stock`);
    }
    const unitPrice = item.product.listingPrice ?? item.product.suggestedPrice;
    return total.add(new Prisma.Decimal(unitPrice).mul(item.quantity));
  }, new Prisma.Decimal(0));
};

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.get(
  "/",
  validate(paginationQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof paginationQuerySchema>;
    const { skip, take, page, limit } = getPagination(query);
    const where = req.user!.role === "ADMIN" ? {} : { buyerId: req.user!.id };
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { id: true, name: true, phone: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ items, meta: { page, limit, total } });
  }),
);

orderRouter.get(
  "/admin",
  requireAdmin,
  validate(paginationQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof paginationQuerySchema>;
    const { skip, take, page, limit } = getPagination(query);
    const [items, total] = await Promise.all([
      prisma.order.findMany({ skip, take, orderBy: { createdAt: "desc" }, include: { buyer: true, items: { include: { product: true } } } }),
      prisma.order.count(),
    ]);
    res.json({ items, meta: { page, limit, total } });
  }),
);

orderRouter.get(
  "/:id",
  validate(orderParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof orderParamsSchema>;
    const where = req.user!.role === "ADMIN" ? { id } : { id, buyerId: req.user!.id };
    const order = await prisma.order.findFirst({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        items: { orderBy: { id: "asc" }, include: { product: true } },
      },
    });
    if (!order) throw new ApiError(404, "Order not found");
    res.json(order);
  }),
);

orderRouter.post(
  "/",
  validate(createOrderSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createOrderSchema>;
    const requestedItems = body.fromCart
      ? (await prisma.cartItem.findMany({ where: { userId: req.user!.id } })).map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      : body.items!;

    const order = await buildOrder(req.user!.id, requestedItems, body.fromCart, body.note);

    res.status(201).json(order);
  }),
);

orderRouter.post(
  "/paypal/create",
  asyncHandler(async (req, res) => {
    const total = await getCartTotal(req.user!.id);
    const paypalOrder = await createPayPalOrder(total.toFixed(2));
    res.status(201).json({ id: paypalOrder.id });
  }),
);

orderRouter.post(
  "/paypal/capture",
  validate(paypalCaptureSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof paypalCaptureSchema>;
    const capture = await capturePayPalOrder(body.paypalOrderId);
    const order = await buildOrderFromCart(req.user!.id, `PayPal sandbox order ${body.paypalOrderId}`);
    res.status(201).json({ paypal: capture, order });
  }),
);
