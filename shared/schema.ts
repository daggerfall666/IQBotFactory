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
    provider: "anthropic" | "google" | "openrouter";
    model: string;
    temperature: number;
    maxTokens: number;
    apiKeys?: {
      anthropic?: string;
      google?: string;
      openrouter?: string;
    };
    theme: {
      primaryColor: string;
      fontFamily: string;
      borderRadius: number;
      chatBubbleStyle: "modern" | "classic";
      darkMode: boolean;
      avatarUrl?: string;
      avatarBackgroundColor?: string;
      botName?: string;
      customMessageStyles?: {
        userBackground?: string;
        botBackground?: string;
        userText?: string;
        botText?: string;
      };
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

export const MODELS = [
  // Claude Models
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    description: "Most capable model, ideal for complex tasks",
    maxTokens: 4096,
    provider: "anthropic"
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    description: "Great balance of intelligence and speed",
    maxTokens: 3072,
    provider: "anthropic"
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    description: "Fastest model, perfect for simple tasks",
    maxTokens: 2048,
    provider: "anthropic"
  },
  // Gemini 1.5 Models
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Advanced multimodal model supporting up to 2M tokens",
    maxTokens: 8192,
    provider: "google"
  },
  {
    id: "gemini-1.5-pro-001",
    name: "Gemini 1.5 Pro 001",
    description: "Stable version of Gemini 1.5 Pro (May 2024)",
    maxTokens: 8192,
    provider: "google"
  },
  {
    id: "gemini-1.5-pro-002",
    name: "Gemini 1.5 Pro 002",
    description: "Latest stable version of Gemini 1.5 Pro (Sep 2024)",
    maxTokens: 8192,
    provider: "google"
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Fast multimodal model for diverse tasks",
    maxTokens: 8192,
    provider: "google"
  },
  {
    id: "gemini-1.5-flash-001",
    name: "Gemini 1.5 Flash 001",
    description: "Stable version of Gemini 1.5 Flash (May 2024)",
    maxTokens: 8192,
    provider: "google"
  },
  {
    id: "gemini-1.5-flash-002",
    name: "Gemini 1.5 Flash 002",
    description: "Latest stable version of Gemini 1.5 Flash (Sep 2024)",
    maxTokens: 8192,
    provider: "google"
  },
  // Gemini 2.0 Models
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Advanced Gemini 2.0 Flash model",
    maxTokens: 8192,
    provider: "google"
  },
  {
    id: "gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash 001",
    description: "Stable version of Gemini 2.0 Flash (Jan 2025)",
    maxTokens: 8192,
    provider: "google"
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash-Lite",
    description: "Lighter, faster version of Gemini 2.0",
    maxTokens: 8192,
    provider: "google"
  },
  {
    id: "gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash-Lite 001",
    description: "Stable version of Gemini 2.0 Flash-Lite",
    maxTokens: 8192,
    provider: "google"
  },
  // OpenRouter Models (OpenAI)
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Balanced model with good performance and low cost",
    maxTokens: 4096,
    provider: "openrouter"
  },
  {
    id: "openai/gpt-4",
    name: "GPT-4",
    description: "Advanced reasoning capabilities",
    maxTokens: 8192,
    provider: "openrouter"
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "Latest GPT-4 model from OpenAI with improved performance",
    maxTokens: 8192,
    provider: "openrouter"
  },
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Faster variant of GPT-4 with good balance of performance",
    maxTokens: 4096,
    provider: "openrouter"
  },
  // OpenRouter Models (Anthropic Claude via OpenRouter)
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus (via OpenRouter)",
    description: "Most capable Claude model via OpenRouter",
    maxTokens: 4096,
    provider: "openrouter"
  },
  {
    id: "anthropic/claude-3-sonnet",
    name: "Claude 3 Sonnet (via OpenRouter)",
    description: "Balanced Claude model via OpenRouter",
    maxTokens: 4096,
    provider: "openrouter"
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku (via OpenRouter)",
    description: "Fast Claude model via OpenRouter",
    maxTokens: 4096,
    provider: "openrouter"
  },
  // OpenRouter Models (Meta Llama)
  {
    id: "meta-llama/llama-3-70b-instruct",
    name: "Llama 3 70B",
    description: "Powerful open model from Meta",
    maxTokens: 4096,
    provider: "openrouter"
  },
  {
    id: "meta-llama/llama-3-8b-instruct",
    name: "Llama 3 8B",
    description: "Lightweight open model from Meta",
    maxTokens: 4096,
    provider: "openrouter"
  },
  // OpenRouter Models (Mistral AI)
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    description: "Advanced model from Mistral AI",
    maxTokens: 4096,
    provider: "openrouter"
  },
  {
    id: "mistralai/mistral-small",
    name: "Mistral Small",
    description: "Compact model from Mistral AI",
    maxTokens: 4096,
    provider: "openrouter"
  },
  {
    id: "mistralai/mistral-7b-instruct",
    name: "Mistral 7B",
    description: "Efficient open weights model from Mistral AI",
    maxTokens: 4096,
    provider: "openrouter"
  },
  {
    id: "mistralai/mixtral-8x7b-instruct",
    name: "Mixtral 8x7B",
    description: "Mixture of experts model from Mistral AI",
    maxTokens: 4096,
    provider: "openrouter"
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