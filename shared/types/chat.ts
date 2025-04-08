import { z } from "zod";

export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string().optional(),
});

export type Message = z.infer<typeof messageSchema>;

export const chatConfigSchema = z.object({
  temperature: z.number().min(0).max(1).default(0.7),
  maxOutputTokens: z.number().positive().default(2048),
  model: z.string().optional(), // Model identifier like gemini-2.0-flash
});

export type ChatConfig = z.infer<typeof chatConfigSchema>;
