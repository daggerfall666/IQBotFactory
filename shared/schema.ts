import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Add DEFAULT_RATE_LIMITS constant
export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  api: {
    windowMs: 60000, // 1 minute
    max: 100
  },
  chat: {
    windowMs: 60000,
    max: 30
  },
  admin: {
    windowMs: 60000,
    max: 20
  },
  upload: {
    windowMs: 60000,
    max: 10
  }
};

// Adicionar nova tabela para configurações do sistema
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  rateLimits: jsonb("rate_limits").$type<RateLimitConfig>().default(DEFAULT_RATE_LIMITS)
});

export const chatbots = pgTable("chatbots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  settings: jsonb("settings").$type<{
    initialMessage: string;
    systemPrompt: string;
    model: "claude-3-opus-20240229" | "claude-3-sonnet-20240229" | "claude-3-haiku-20240307";
    temperature: number;
    maxTokens: number;
    theme: {
      primaryColor: string;
      fontFamily: string;
      borderRadius: number;
      chatBubbleStyle: "modern" | "classic";
      darkMode: boolean;
    };
  }>().notNull(),
  wordpressConfig: jsonb("wordpress_config").$type<{
    position: "bottom-right" | "bottom-left" | "custom";
    customCss: string;
    hideOnMobile: boolean;
    customPosition: {
      top?: string;
      bottom?: string;
      left?: string;
      right?: string;
    };
  }>().notNull(),
  apiKey: text("api_key"),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  sourceUrl: text("source_url"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const chatInteractions = pgTable("chat_interactions", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").notNull(),
  userMessage: text("user_message").notNull(),
  botResponse: text("bot_response").notNull(),
  model: text("model").notNull(),
  tokensUsed: integer("tokens_used").notNull(),
  responseTime: integer("response_time").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
});

export const insertChatbotSchema = createInsertSchema(chatbots, {
  apiKey: z.string().nullable(),
}).omit({ id: true });

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true, uploadedAt: true });

export const insertChatInteractionSchema = createInsertSchema(chatInteractions).omit({
  id: true,
  timestamp: true,
  success: true,
  errorMessage: true
});

export type Chatbot = typeof chatbots.$inferSelect;
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type ChatInteraction = typeof chatInteractions.$inferSelect;
export type InsertChatInteraction = z.infer<typeof insertChatInteractionSchema>;

export const CLAUDE_MODELS = [
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    description: "Most capable model, ideal for complex tasks",
    maxTokens: 4096
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    description: "Great balance of intelligence and speed",
    maxTokens: 3072
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    description: "Fastest model, perfect for simple tasks",
    maxTokens: 2048
  }
] as const;

export type SystemSetting = typeof systemSettings.$inferSelect;

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true
});

// Rate limit configuration type
export const rateLimitConfigSchema = z.object({
  api: z.object({
    windowMs: z.number(),
    max: z.number(),
  }),
  chat: z.object({
    windowMs: z.number(),
    max: z.number(),
  }),
  admin: z.object({
    windowMs: z.number(),
    max: z.number(),
  }),
  upload: z.object({
    windowMs: z.number(),
    max: z.number(),
  })
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;