import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatbotSchema, insertKnowledgeBaseSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { db, chatInteractions } from './db'; // Added import for db and table
import { eq } from 'drizzle-orm'; // Added import for eq

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const anthropic = new Anthropic({ apiKey });

    // Tenta fazer uma chamada simples para validar a chave
    await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [{ role: "user", content: "test" }]
    });

    return true;
  } catch (err) {
    console.error("Error validating API key:", err);
    return false;
  }
}

async function getAnthropicClient(apiKey?: string | null) {
  // Se apiKey for undefined ou null, usa a chave do sistema
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;

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

  // Chat endpoint - UPDATED
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

      console.log("Using API key:", bot.apiKey ? "Bot's own key" : "System key");

      try {
        const startTime = Date.now();
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

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Registra a interação
        await db.insert(chatInteractions).values({
          botId,
          userMessage: message,
          botResponse: response.content[0].text,
          model: bot.settings.model,
          tokensUsed: response.usage?.output_tokens || 0,
          responseTime,
          success: true,
          timestamp: new Date() // Added timestamp
        });

        res.json({ response: response.content[0].text });
      } catch (err) {
        console.error("Chat error:", err);

        // Registra a interação com erro
        await db.insert(chatInteractions).values({
          botId,
          userMessage: message,
          botResponse: "",
          model: bot.settings.model,
          tokensUsed: 0,
          responseTime: 0,
          success: false,
          errorMessage: err instanceof Error ? err.message : "Unknown error",
          timestamp: new Date() // Added timestamp
        });

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

  // Novo endpoint para analytics
  app.get("/api/analytics/:botId", async (req, res) => {
    try {
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

      // Busca todas as interações do bot
      const interactions = await db
        .select()
        .from(chatInteractions)
        .where(eq(chatInteractions.botId, botId));

      // Calcula métricas
      const totalInteractions = interactions.length;
      const successfulInteractions = interactions.filter(i => i.success).length;
      const averageResponseTime = interactions.reduce((acc, i) => acc + i.responseTime, 0) / (totalInteractions || 1); // Handle division by zero
      const totalTokensUsed = interactions.reduce((acc, i) => acc + i.tokensUsed, 0);

      // Agrupa por dia para o gráfico de uso
      const usageByDay = interactions.reduce((acc, i) => {
        const date = new Date(i.timestamp).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = 0;
        acc[date]++;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalInteractions,
        successfulInteractions,
        averageResponseTime,
        totalTokensUsed,
        usageByDay: Object.entries(usageByDay).map(([date, count]) => ({
          date,
          interactions: count
        }))
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ error: "Failed to fetch analytics" });
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

      // Valida a chave antes de salvar
      const isValid = await validateAnthropicKey(key);
      if (!isValid) {
        res.status(400).json({ error: "Invalid API key. Please check if the key is correct and try again." });
        return;
      }

      // Atualiza a variável de ambiente
      process.env.ANTHROPIC_API_KEY = key;

      // Atualiza todos os bots que usam a chave do sistema (apiKey = null)
      try {
        const bots = await storage.listChatbots();
        for (const bot of bots) {
          if (bot.apiKey === null) {
            await storage.updateChatbot(bot.id, { apiKey: key });
          }
        }
      } catch (err) {
        console.error("Error updating bots:", err);
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating system API key:", err);
      res.status(500).json({ error: "Failed to update system API key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}