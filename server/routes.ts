import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatbotSchema, insertKnowledgeBaseSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { db, chatInteractions } from './db';
import { eq } from 'drizzle-orm';
import { apiLimiter, chatLimiter, adminLimiter } from './middleware/rateLimiter';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey.startsWith('sk-ant-')) {
      console.error("Invalid API key format");
      return false;
    }

    const anthropic = new Anthropic({ apiKey });

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
  try {
    let key = apiKey;
    if (!key) {
      key = await storage.getSystemSetting('ANTHROPIC_API_KEY');
      if (!key) {
        throw new Error("No API key available");
      }
    }

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
  // Apply general API rate limiting to all /api routes
  app.use('/api', apiLimiter);

  // Chatbot CRUD endpoints
  app.post("/api/chatbots", apiLimiter, async (req, res) => {
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

  app.get("/api/chatbots", apiLimiter, async (_req, res) => {
    try {
      const chatbots = await storage.listChatbots();
      res.json(chatbots);
    } catch (err) {
      console.error("Error listing chatbots:", err);
      res.status(500).json({ error: "Failed to list chatbots" });
    }
  });

  app.get("/api/chatbots/:id", apiLimiter, async (req, res) => {
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

  app.patch("/api/chatbots/:id", apiLimiter, async (req, res) => {
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

  app.delete("/api/chatbots/:id", apiLimiter, async (req, res) => {
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

  // Chat endpoint with stricter rate limiting
  app.post("/api/chat/:botId", chatLimiter, async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.length > 2000) {
        console.error("Invalid message:", message);
        res.status(400).json({ error: "Invalid message format or length" });
        return;
      }

      const botId = parseInt(req.params.botId);
      if (isNaN(botId)) {
        console.error("Invalid bot ID:", req.params.botId);
        res.status(400).json({ error: "Invalid bot ID" });
        return;
      }

      const bot = await storage.getChatbot(botId);
      if (!bot) {
        console.error("Chatbot not found:", botId);
        res.status(404).json({ error: "Chatbot not found" });
        return;
      }

      const kb = await storage.listKnowledgeBase(botId);
      const context = kb.map(entry => entry.content).join("\n\n");

      console.log("Processing chat request:", {
        botId,
        messageLength: message.length,
        hasContext: !!context
      });

      try {
        const startTime = Date.now();
        const anthropic = await getAnthropicClient(bot.apiKey);

        console.log("Making API request with model:", bot.settings.model);

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

        // Get the response content safely
        const botResponse = response.content[0].type === 'text' 
          ? response.content[0].text 
          : 'Error: Unexpected response format';

        console.log("Chat interaction stats:", {
          responseTime,
          tokensUsed: response.usage?.output_tokens || 0,
          responseLength: botResponse.length
        });

        // Registrar a interação
        const chatInteraction = await db.insert(chatInteractions).values({
          botId,
          userMessage: message,
          botResponse,
          model: bot.settings.model,
          tokensUsed: response.usage?.output_tokens || 0,
          responseTime,
          success: true,
          timestamp: new Date() 
        }).returning();

        console.log("Saved chat interaction:", chatInteraction);

        res.json({ response: botResponse });
      } catch (err) {
        console.error("Chat error:", err);

        await db.insert(chatInteractions).values({
          botId,
          userMessage: message,
          botResponse: "",
          model: bot.settings.model,
          tokensUsed: 0,
          responseTime: 0,
          success: false,
          errorMessage: err instanceof Error ? err.message : "Unknown error",
          timestamp: new Date() 
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

  // Analytics endpoint
  app.get("/api/analytics/:botId", apiLimiter, async (req, res) => {
    try {
      const botId = parseInt(req.params.botId);
      if (isNaN(botId)) {
        console.error("Invalid bot ID:", req.params.botId);
        res.status(400).json({ error: "Invalid bot ID" });
        return;
      }

      const bot = await storage.getChatbot(botId);
      if (!bot) {
        console.error("Chatbot not found:", botId);
        res.status(404).json({ error: "Chatbot not found" });
        return;
      }

      console.log("Fetching analytics for bot:", botId);

      try {
        // Log the SQL query being executed
        console.log("Executing query for chat_interactions");

        const interactions = await db
          .select()
          .from(chatInteractions)
          .where(eq(chatInteractions.botId, botId))
          .catch(err => {
            console.error("Database query error:", err);
            throw new Error("Failed to fetch chat interactions");
          });

        console.log("Raw interactions data:", interactions);

        // Return empty statistics if no interactions found
        if (!interactions || interactions.length === 0) {
          console.log("No interactions found for bot:", botId);
          return res.json({
            totalInteractions: 0,
            successfulInteractions: 0,
            averageResponseTime: 0,
            totalTokensUsed: 0,
            usageByDay: []
          });
        }

        // Garantir que temos valores padrão e dados válidos
        const totalInteractions = interactions.length;
        const successfulInteractions = interactions.filter(i => i?.success === true).length;

        let averageResponseTime = 0;
        if (totalInteractions > 0) {
          const totalTime = interactions.reduce((acc, i) => {
            const time = typeof i.responseTime === 'number' ? i.responseTime : 0;
            return acc + time;
          }, 0);
          averageResponseTime = Math.round(totalTime / totalInteractions);
        }

        const totalTokensUsed = interactions.reduce((acc, i) => {
          const tokens = typeof i.tokensUsed === 'number' ? i.tokensUsed : 0;
          return acc + tokens;
        }, 0);

        // Agrupar interações por dia com validação de data
        const usageByDay = interactions.reduce((acc, i) => {
          try {
            const timestamp = i?.timestamp ? new Date(i.timestamp) : null;
            if (timestamp && !isNaN(timestamp.getTime())) {
              const date = timestamp.toISOString().split('T')[0];
              acc[date] = (acc[date] || 0) + 1;
            }
          } catch (err) {
            console.error("Error processing interaction date:", err);
          }
          return acc;
        }, {} as Record<string, number>);

        const response = {
          totalInteractions,
          successfulInteractions,
          averageResponseTime,
          totalTokensUsed,
          usageByDay: Object.entries(usageByDay)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, count]) => ({
              date,
              interactions: count
            }))
        };

        console.log("Final analytics response:", response);
        res.json(response);
      } catch (dbErr) {
        console.error("Database query error:", dbErr);
        throw new Error(`Database error: ${dbErr instanceof Error ? dbErr.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ 
        error: "Failed to fetch analytics",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });


  // Admin routes with strict rate limiting
  app.post("/api/admin/system-key", adminLimiter, async (req, res) => {
    try {
      const { key } = req.body;

      if (!key || typeof key !== "string" || !key.startsWith("sk-ant-")) {
        res.status(400).json({ 
          error: "Formato de chave API inválido",
          details: "A chave API deve começar com 'sk-ant-'" 
        });
        return;
      }

      const isValid = await validateAnthropicKey(key);
      if (!isValid) {
        res.status(400).json({ 
          error: "Chave API inválida",
          details: "A chave API fornecida não é válida ou está expirada."
        });
        return;
      }

      await storage.setSystemSetting('ANTHROPIC_API_KEY', key);
      console.log("System API key updated successfully");

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating system API key:", err);
      res.status(500).json({ 
        error: "Erro ao atualizar a chave API do sistema",
        details: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  // Novo endpoint para buscar a chave API do sistema
  app.get("/api/admin/system-key", adminLimiter, async (_req, res) => {
    try {
      const key = await storage.getSystemSetting('ANTHROPIC_API_KEY');
      res.json({ key });
    } catch (err) {
      console.error("Error fetching system API key:", err);
      res.status(500).json({ 
        error: "Erro ao buscar a chave API do sistema",
        details: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}