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

async function getAnthropicClient(apiKey?: string | null) {
  // Se apiKey for null, usa a chave do sistema
  const key = apiKey === null ? process.env.ANTHROPIC_API_KEY : apiKey;

  if (!key) {
    throw new Error("No API key available");
  }

  try {
    const anthropic = new Anthropic({
      apiKey: key
    });
    return anthropic;
  } catch (err) {
    console.error("Error creating Anthropic client:", err);
    throw new Error("Failed to initialize AI client");
  }
}

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
    try {
      const chatbots = await storage.listChatbots();
      res.json(chatbots);
    } catch (err) {
      console.error("Error listing chatbots:", err);
      res.status(500).json({ error: "Failed to list chatbots" });
    }
  });

  app.get("/api/chatbots/:id", async (req, res) => {
    try {
      const chatbot = await storage.getChatbot(parseInt(req.params.id));
      if (!chatbot) {
        res.status(404).json({ error: "Chatbot not found" });
        return;
      }
      res.json(chatbot);
    } catch (err) {
      console.error("Error getting chatbot:", err);
      res.status(500).json({ error: "Failed to get chatbot" });
    }
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

  app.delete("/api/chatbots/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChatbot(parseInt(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: "Chatbot not found" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete chatbot" });
    }
  });

  // Chat endpoint
  app.post("/api/chat/:botId", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.length > 2000) {
        res.status(400).json({ error: "Invalid message format or length" });
        return;
      }

      const botId = parseInt(req.params.botId);
      if (isNaN(botId)) {
        res.status(400).json({ error: "Invalid bot ID" });
        return;
      }

      const bot = await storage.getChatbot(botId);
      if (!bot) {
        res.status(404).json({ error: "Chatbot not found" });
        return;
      }

      const kb = await storage.listKnowledgeBase(botId);
      const context = kb.map(entry => entry.content).join("\n\n");

      try {
        const anthropic = await getAnthropicClient(bot.apiKey);

        const response = await anthropic.messages.create({
          model: bot.settings.model,
          max_tokens: bot.settings.maxTokens,
          temperature: bot.settings.temperature,
          messages: [
            { 
              role: "user", 
              content: context ? 
                `Sistema: ${bot.settings.systemPrompt}\n\nContexto: ${context}\n\nUsuário: ${message}` :
                `Sistema: ${bot.settings.systemPrompt}\n\nUsuário: ${message}`
            }
          ],
        });

        res.json({ response: response.content[0].text });
      } catch (err) {
        console.error("Chat error:", err);
        if (err instanceof Anthropic.APIError) {
          res.status(err.status || 500).json({
            error: "AI Service Error",
            details: "Chave API inválida ou inexistente. Por favor, verifique a configuração."
          });
        } else {
          res.status(500).json({ 
            error: "Erro ao processar mensagem",
            details: err instanceof Error ? err.message : "Erro desconhecido"
          });
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      res.status(500).json({ 
        error: "Erro ao processar mensagem",
        details: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  // Admin routes
  app.post("/api/admin/system-key", async (req, res) => {
    try {
      const { key } = req.body;

      if (!key || typeof key !== "string" || !key.startsWith("sk-ant-")) {
        res.status(400).json({ error: "Invalid API key format" });
        return;
      }

      // Atualiza a variável de ambiente
      process.env.ANTHROPIC_API_KEY = key;

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating system API key:", err);
      res.status(500).json({ error: "Failed to update system API key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}