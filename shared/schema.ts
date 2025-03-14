import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chatbots = pgTable("chatbots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  settings: jsonb("settings").$type<{
    initialMessage: string;
    temperature: number;
    maxTokens: number;
    theme: {
      primaryColor: string;
      fontFamily: string;
      borderRadius: number;
    };
  }>().notNull(),
  wordpressConfig: jsonb("wordpress_config").$type<{
    position: "bottom-right" | "bottom-left" | "custom";
    customCss: string;
  }>().notNull(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").notNull(),
  type: text("type").notNull(), // 'document' | 'website'
  content: text("content").notNull(),
  sourceUrl: text("source_url"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertChatbotSchema = createInsertSchema(chatbots).omit({ id: true });
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true, uploadedAt: true });

export type Chatbot = typeof chatbots.$inferSelect;
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
