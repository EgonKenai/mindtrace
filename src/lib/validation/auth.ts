import { z } from "zod";

export const sessionRequestSchema = z.object({
  idToken: z.string().min(1).max(10_000),
});
