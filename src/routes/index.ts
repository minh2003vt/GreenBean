import { Router } from "express";
import { challengeRouter } from "./challenges.routes.js";
import { cartRouter } from "./cart.routes.js";
import { orderRouter } from "./orders.routes.js";
import { problemRouter } from "./problems.routes.js";
import { productRouter } from "./products.routes.js";
import { uploadRouter } from "./uploads.routes.js";
import { userChallengeRouter } from "./user-challenges.routes.js";
import { userRouter } from "./users.routes.js";

export const apiRouter = Router();

apiRouter.use("/users", userRouter);
apiRouter.use("/problems", problemRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/challenges", challengeRouter);
apiRouter.use("/user-challenges", userChallengeRouter);
apiRouter.use("/uploads", uploadRouter);
