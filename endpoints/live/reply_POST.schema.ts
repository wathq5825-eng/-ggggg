import { z } from "zod";

export const schema = z.object({
  persona: z.enum(["wathiq", "jakleeta"]),
  dialect: z.enum(["iraqi", "msa"]),
  username: z.string().trim().min(1).max(60),
  comment: z.string().trim().min(1).max(500),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { reply: string };