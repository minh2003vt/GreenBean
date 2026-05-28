import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const upsertCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const itemParamsSchema = z.object({ id: z.string().uuid() });

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: { product: true },
    });
    res.json(items);
  }),
);

cartRouter.post(
  "/",
  validate(upsertCartItemSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof upsertCartItemSchema>;
    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user!.id, productId: body.productId } },
      update: { quantity: { increment: body.quantity } },
      create: { userId: req.user!.id, productId: body.productId, quantity: body.quantity },
      include: { product: true },
    });
    res.status(201).json(item);
  }),
);

cartRouter.patch(
  "/:id",
  validate(itemParamsSchema, "params"),
  validate(z.object({ quantity: z.number().int().positive() })),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof itemParamsSchema>;
    const { quantity } = req.body as { quantity: number };
    const item = await prisma.cartItem.update({
      where: { id, userId: req.user!.id },
      data: { quantity },
      include: { product: true },
    });
    res.json(item);
  }),
);

cartRouter.delete(
  "/:id",
  validate(itemParamsSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof itemParamsSchema>;
    await prisma.cartItem.delete({ where: { id, userId: req.user!.id } });
    res.status(204).send();
  }),
);
