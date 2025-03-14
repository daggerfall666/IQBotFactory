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
    const chatbot: Chatbot = { ...bot, id };
    this.chatbots.set(id, chatbot);
    return chatbot;
  }

  async getChatbot(id: number): Promise<Chatbot | undefined> {
    return this.chatbots.get(id);
  }

  async listChatbots(): Promise<Chatbot[]> {
    return Array.from(this.chatbots.values());
  }

  async updateChatbot(id: number, bot: Partial<InsertChatbot>): Promise<Chatbot | undefined> {
    const existing = this.chatbots.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...bot };
    this.chatbots.set(id, updated);
    return updated;
  }

  async deleteChatbot(id: number): Promise<boolean> {
    return this.chatbots.delete(id);
  }

  async addKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const id = this.kbId++;
    const entry: KnowledgeBase = { 
      ...kb, 
      id,
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
