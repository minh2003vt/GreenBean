import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const getPagination = (query: z.infer<typeof paginationQuerySchema>) => {
  const page = query.page;
  const limit = query.limit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
};
