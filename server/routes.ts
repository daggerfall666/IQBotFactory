import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatbotSchema, insertKnowledgeBaseSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Chatbot CRUD endpoints
  app.post("/api/chatbots", async (req, res) => {
    try {
      const validated = insertChatbotSchema.parse(req.body);
      const chatbot = await storage.createChatbot(validated);
      res.json(chatbot);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: "Failed to create chatbot" });
      }
    }
  });

  app.get("/api/chatbots", async (_req, res) => {
    const chatbots = await storage.listChatbots();
    res.json(chatbots);
  });

  app.get("/api/chatbots/:id", async (req, res) => {
    const chatbot = await storage.getChatbot(parseInt(req.params.id));
    if (!chatbot) {
      res.status(404).json({ error: "Chatbot not found" });
      return;
    }
    res.json(chatbot);
  });

  app.patch("/api/chatbots/:id", async (req, res) => {
    try {
      const validated = insertChatbotSchema.partial().parse(req.body);
      const chatbot = await storage.updateChatbot(parseInt(req.params.id), validated);
      if (!chatbot) {
        res.status(404).json({ error: "Chatbot not found" });
        return;
      }
      res.json(chatbot);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: "Failed to update chatbot" });
      }
    }
  });

  // Knowledge base endpoints
  app.post("/api/knowledge-base", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const content = req.file.buffer.toString();
      const entry = insertKnowledgeBaseSchema.parse({
        botId: parseInt(req.body.botId),
        type: "document",
        content,
        sourceUrl: null
      });

      const kb = await storage.addKnowledgeBase(entry);
      res.json(kb);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: "Failed to add knowledge base entry" });
      }
    }
  });

  app.get("/api/knowledge-base/:botId", async (req, res) => {
    const entries = await storage.listKnowledgeBase(parseInt(req.params.botId));
    res.json(entries);
  });

  // Chat endpoint
  app.post("/api/chat/:botId", async (req, res) => {
    try {
      const { message } = req.body;
      const botId = parseInt(req.params.botId);

      const bot = await storage.getChatbot(botId);
      if (!bot) {
        res.status(404).json({ error: "Chatbot not found" });
        return;
      }

      const kb = await storage.listKnowledgeBase(botId);
      const context = kb.map(entry => entry.content).join("\n\n");

      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: bot.settings.maxTokens,
        messages: [
          { role: "user", content: `Context: ${context}\n\nUser question: ${message}` }
        ],
      });

      res.json({ response: response.content[0].text });
    } catch (err) {
      console.error("Chat error:", err);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}