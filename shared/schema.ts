import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertChatbotSchema = createInsertSchema(chatbots, {
  apiKey: z.string().nullable(),
}).omit({ id: true });

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true, uploadedAt: true });

export type Chatbot = typeof chatbots.$inferSelect;
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;

// Available Claude models with descriptions
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