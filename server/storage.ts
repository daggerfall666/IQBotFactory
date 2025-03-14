import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Chatbot, InsertChatbot, KnowledgeBase, InsertKnowledgeBase, chatbots, knowledgeBase, systemSettings } from "@shared/schema";
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  createChatbot(bot: InsertChatbot): Promise<Chatbot>;
  getChatbot(id: number): Promise<Chatbot | undefined>;
  listChatbots(): Promise<Chatbot[]>;
  updateChatbot(id: number, bot: Partial<InsertChatbot>): Promise<Chatbot | undefined>;
  deleteChatbot(id: number): Promise<boolean>;

  addKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase>;
  getKnowledgeBase(id: number): Promise<KnowledgeBase | undefined>;
  listKnowledgeBase(botId: number): Promise<KnowledgeBase[]>;
  deleteKnowledgeBase(id: number): Promise<boolean>;

  // Novas funções para gerenciar configurações do sistema
  getSystemSetting(key: string): Promise<string | null>;
  setSystemSetting(key: string, value: string): Promise<void>;
}

export class PostgresStorage implements IStorage {
  async createChatbot(bot: InsertChatbot): Promise<Chatbot> {
    const [chatbot] = await db.insert(chatbots).values(bot).returning();
    console.log("Created chatbot:", chatbot);
    return chatbot;
  }

  async getChatbot(id: number): Promise<Chatbot | undefined> {
    const [chatbot] = await db.select().from(chatbots).where(eq(chatbots.id, id));
    console.log("Getting chatbot:", id, chatbot);
    return chatbot;
  }

  async listChatbots(): Promise<Chatbot[]> {
    const results = await db.select().from(chatbots);
    console.log("Listing chatbots:", results);
    return results;
  }

  async updateChatbot(id: number, bot: Partial<InsertChatbot>): Promise<Chatbot | undefined> {
    const [updated] = await db
      .update(chatbots)
      .set(bot)
      .where(eq(chatbots.id, id))
      .returning();
    console.log("Updated chatbot:", updated);
    return updated;
  }

  async deleteChatbot(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(chatbots)
      .where(eq(chatbots.id, id))
      .returning();
    console.log("Deleted chatbot:", id, !!deleted);
    return !!deleted;
  }

  async addKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [entry] = await db.insert(knowledgeBase).values(kb).returning();
    return entry;
  }

  async getKnowledgeBase(id: number): Promise<KnowledgeBase | undefined> {
    const [entry] = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, id));
    return entry;
  }

  async listKnowledgeBase(botId: number): Promise<KnowledgeBase[]> {
    return db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.botId, botId));
  }

  async deleteKnowledgeBase(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(knowledgeBase)
      .where(eq(knowledgeBase.id, id))
      .returning();
    return !!deleted;
  }

  async getSystemSetting(key: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting?.value ?? null;
  }

  async setSystemSetting(key: string, value: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() }
      });
  }
}

export const storage = new PostgresStorage();