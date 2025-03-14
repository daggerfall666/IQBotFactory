import { Chatbot, InsertChatbot, KnowledgeBase, InsertKnowledgeBase } from "@shared/schema";

export interface IStorage {
  // Chatbot operations
  createChatbot(bot: InsertChatbot): Promise<Chatbot>;
  getChatbot(id: number): Promise<Chatbot | undefined>;
  listChatbots(): Promise<Chatbot[]>;
  updateChatbot(id: number, bot: Partial<InsertChatbot>): Promise<Chatbot | undefined>;
  deleteChatbot(id: number): Promise<boolean>;

  // Knowledge base operations
  addKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase>;
  getKnowledgeBase(id: number): Promise<KnowledgeBase | undefined>;
  listKnowledgeBase(botId: number): Promise<KnowledgeBase[]>;
  deleteKnowledgeBase(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private chatbots: Map<number, Chatbot>;
  private knowledgeBase: Map<number, KnowledgeBase>;
  private chatbotId: number;
  private kbId: number;

  constructor() {
    this.chatbots = new Map();
    this.knowledgeBase = new Map();
    this.chatbotId = 1;
    this.kbId = 1;
  }

  async createChatbot(bot: InsertChatbot): Promise<Chatbot> {
    const id = this.chatbotId++;
    const chatbot: Chatbot = { 
      id, 
      name: bot.name,
      description: bot.description || "",
      settings: bot.settings,
      wordpressConfig: bot.wordpressConfig,
      apiKey: bot.apiKey
    };
    this.chatbots.set(id, chatbot);
    console.log("Created chatbot:", chatbot);
    return chatbot;
  }

  async getChatbot(id: number): Promise<Chatbot | undefined> {
    const bot = this.chatbots.get(id);
    console.log("Getting chatbot:", id, bot);
    return bot;
  }

  async listChatbots(): Promise<Chatbot[]> {
    const bots = Array.from(this.chatbots.values());
    console.log("Listing chatbots:", bots);
    return bots;
  }

  async updateChatbot(id: number, bot: Partial<InsertChatbot>): Promise<Chatbot | undefined> {
    const existing = this.chatbots.get(id);
    if (!existing) return undefined;

    const updated: Chatbot = {
      ...existing,
      name: bot.name || existing.name,
      description: bot.description || existing.description,
      settings: bot.settings || existing.settings,
      wordpressConfig: bot.wordpressConfig || existing.wordpressConfig,
      apiKey: bot.apiKey !== undefined ? bot.apiKey : existing.apiKey
    };

    this.chatbots.set(id, updated);
    console.log("Updated chatbot:", updated);
    return updated;
  }

  async deleteChatbot(id: number): Promise<boolean> {
    const deleted = this.chatbots.delete(id);
    console.log("Deleted chatbot:", id, deleted);
    return deleted;
  }

  async addKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = this.kbId++;
    const entry: KnowledgeBase = {
      id,
      botId: kb.botId,
      type: kb.type,
      content: kb.content,
      sourceUrl: kb.sourceUrl || null,
      uploadedAt: new Date()
    };
    this.knowledgeBase.set(id, entry);
    return entry;
  }

  async getKnowledgeBase(id: number): Promise<KnowledgeBase | undefined> {
    return this.knowledgeBase.get(id);
  }

  async listKnowledgeBase(botId: number): Promise<KnowledgeBase[]> {
    return Array.from(this.knowledgeBase.values())
      .filter(kb => kb.botId === botId);
  }

  async deleteKnowledgeBase(id: number): Promise<boolean> {
    return this.knowledgeBase.delete(id);
  }
}

export const storage = new MemStorage();