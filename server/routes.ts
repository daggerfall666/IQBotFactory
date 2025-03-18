import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatbotSchema, insertKnowledgeBaseSchema, rateLimitConfigSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { db, chatInteractions } from './db';
import { eq, desc, sql } from 'drizzle-orm';
import { apiLimiter, chatLimiter, adminLimiter, uploadLimiter } from './middleware/rateLimiter';
import { performance } from 'perf_hooks';
import os from 'os';
import { logger } from './utils/logger';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey.startsWith('sk-ant-')) {
      logger.error("Invalid API key format");
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
    logger.error("Error validating API key:", err);
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
    logger.error("Error creating Anthropic client:", err);
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
        logger.error("Failed to create chatbot", err as Error);
        res.status(500).json({ error: "Failed to create chatbot" });
      }
    }
  });

  app.get("/api/chatbots", apiLimiter, async (_req, res) => {
    try {
      const chatbots = await storage.listChatbots();
      res.json(chatbots);
    } catch (err) {
      logger.error("Error listing chatbots:", err);
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
      logger.error("Error getting chatbot:", err);
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
        logger.error("Failed to update chatbot", err as Error);
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
      logger.error("Failed to delete chatbot", err as Error);
      res.status(500).json({ error: "Failed to delete chatbot" });
    }
  });

  // Chat endpoint with stricter rate limiting
  app.post("/api/chat/:botId", chatLimiter, async (req, res) => {
    const startTime = performance.now();

    try {
      const { message } = req.body;

      // Enhanced input validation
      if (!req.body || typeof req.body !== 'object') {
        logger.warn("Invalid request body", { body: req.body });
        return res.status(400).json({ 
          error: "Invalid request format",
          details: "Request body must be a JSON object"
        });
      }

      if (!message) {
        logger.warn("Missing message in request", { body: req.body });
        return res.status(400).json({ 
          error: "Missing message",
          details: "Message field is required"
        });
      }

      if (typeof message !== 'string') {
        logger.warn("Invalid message type", { 
          messageType: typeof message,
          receivedValue: message 
        });
        return res.status(400).json({ 
          error: "Invalid message format",
          details: "Message must be a string"
        });
      }

      if (message.length > 2000 || message.length === 0) {
        logger.warn("Invalid message length", { messageLength: message.length });
        return res.status(400).json({ 
          error: "Invalid message length",
          details: "Message must be between 1 and 2000 characters"
        });
      }

      const botId = parseInt(req.params.botId);
      if (isNaN(botId)) {
        logger.warn("Invalid bot ID", { 
          botId: req.params.botId,
          type: typeof req.params.botId 
        });
        return res.status(400).json({ 
          error: "Invalid bot ID",
          details: "Bot ID must be a valid number"
        });
      }

      const bot = await storage.getChatbot(botId);
      if (!bot) {
        logger.warn("Chatbot not found", { botId });
        return res.status(404).json({ 
          error: "Chatbot not found",
          details: "No chatbot exists with the provided ID"
        });
      }

      const kb = await storage.listKnowledgeBase(botId);
      const context = kb.map(entry => entry.content).join("\n\n");

      logger.info("Processing chat request", {
        botId,
        messageLength: message.length,
        hasContext: !!context,
        model: bot.settings.model
      });

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

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        if (!response.content || !response.content[0]) {
          throw new Error("Empty response from AI service");
        }

        const content = response.content[0];
        if (content.type !== 'text') {
          throw new Error(`Unexpected response type: ${content.type}`);
        }

        const botResponse = content.text;

        logger.info("Chat interaction completed", {
          botId,
          responseTime,
          tokensUsed: response.usage?.output_tokens,
          success: true
        });

        // Register the interaction
        await db.insert(chatInteractions).values({
          botId,
          userMessage: message,
          botResponse,
          model: bot.settings.model,
          tokensUsed: response.usage?.output_tokens || 0,
          responseTime: Math.round(responseTime),
          success: true,
          timestamp: new Date()
        });

        return res.json({ response: botResponse });
      } catch (err) {
        logger.error("Chat AI service error", err as Error, {
          botId,
          model: bot.settings.model
        });

        await db.insert(chatInteractions).values({
          botId,
          userMessage: message,
          botResponse: "",
          model: bot.settings.model,
          tokensUsed: 0,
          responseTime: Math.round(performance.now() - startTime),
          success: false,
          errorMessage: err instanceof Error ? err.message : "Unknown error",
          timestamp: new Date()
        });

        if (err instanceof Anthropic.APIError) {
          return res.status(err.status || 500).json({
            error: "AI Service Error",
            details: "Invalid or missing API key. Please check the configuration."
          });
        } else {
          return res.status(500).json({ 
            error: "Error processing message",
            details: err instanceof Error ? err.message : "Unknown error"
          });
        }
      }
    } catch (err) {
      logger.error("Unhandled chat error", err as Error);
      return res.status(500).json({ 
        error: "Error processing message",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics/:botId", apiLimiter, async (req, res) => {
    try {
      const botId = parseInt(req.params.botId);
      if (isNaN(botId)) {
        logger.warn("Invalid bot ID", { botId: req.params.botId });
        res.status(400).json({ error: "Invalid bot ID" });
        return;
      }

      const bot = await storage.getChatbot(botId);
      if (!bot) {
        logger.warn("Chatbot not found", { botId });
        res.status(404).json({ error: "Chatbot not found" });
        return;
      }

      logger.info("Fetching analytics for bot", { botId });

      try {
        // Log the SQL query being executed
        logger.info("Executing query for chat_interactions");

        const interactions = await db
          .select()
          .from(chatInteractions)
          .where(eq(chatInteractions.botId, botId))
          .catch(err => {
            logger.error("Database query error:", err);
            throw new Error("Failed to fetch chat interactions");
          });

        logger.debug("Raw interactions data:", interactions);

        // Return empty statistics if no interactions found
        if (!interactions || interactions.length === 0) {
          logger.info("No interactions found for bot", { botId });
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
            logger.error("Error processing interaction date:", err);
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

        logger.info("Final analytics response:", response);
        res.json(response);
      } catch (dbErr) {
        logger.error("Database query error:", dbErr);
        throw new Error(`Database error: ${dbErr instanceof Error ? dbErr.message : 'Unknown error'}`);
      }
    } catch (err) {
      logger.error("Analytics error:", err);
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
      logger.info("System API key updated successfully");

      res.json({ success: true });
    } catch (err) {
      logger.error("Error updating system API key:", err);
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
      logger.error("Error fetching system API key:", err);
      res.status(500).json({ 
        error: "Erro ao buscar a chave API do sistema",
        details: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  // Prompt generation endpoint with API limiter
  app.post("/api/generate-prompt", apiLimiter, async (req, res) => {
    try {
      const { mission } = req.body;

      if (!mission || typeof mission !== 'string' || mission.length > 1000) {
        logger.warn("Invalid mission", { missionLength: mission?.length, missionType: typeof mission });
        res.status(400).json({ error: "Invalid mission format or length" });
        return;
      }

      logger.info("Generating prompt for mission", { mission });

      const systemKey = await storage.getSystemSetting('ANTHROPIC_API_KEY');
      if (!systemKey) {
        logger.error("No system API key available");
        res.status(500).json({ error: "System API key not configured" });
        return;
      }

      const anthropic = new Anthropic({ apiKey: systemKey });

      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          { 
            role: "user", 
            content: `As an AI expert, create an optimal system prompt for a chatbot with the following mission: "${mission}"

The system prompt should:
1. Be clear and specific about the chatbot's role and capabilities
2. Include any necessary constraints or guidelines
3. Define the tone and style of communication
4. Incorporate best practices for chatbot interactions

Format the response as a single, well-structured system prompt without any explanations or metadata.`
          }
        ],
      });

      const generatedPrompt = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Error: Unexpected response format';

      logger.info("Generated prompt", { generatedPrompt });
      res.json({ prompt: generatedPrompt });

    } catch (err) {
      logger.error("Prompt generation error:", err);
      res.status(500).json({ 
        error: "Failed to generate prompt",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  app.post("/api/improve-prompt", apiLimiter, async (req, res) => {
    try {
      const { currentPrompt } = req.body;

      if (!currentPrompt || typeof currentPrompt !== 'string' || currentPrompt.length > 2000) {
        logger.warn("Invalid prompt", { promptLength: currentPrompt?.length, promptType: typeof currentPrompt });
        res.status(400).json({ error: "Invalid prompt format or length" });
        return;
      }

      logger.info("Improving prompt", { currentPrompt });

      const systemKey = await storage.getSystemSetting('ANTHROPIC_API_KEY');
      if (!systemKey) {
        logger.error("No system API key available");
        res.status(500).json({ error: "System API key not configured" });
        return;
      }

      const anthropic = new Anthropic({ apiKey: systemKey });

      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          { 
            role: "user", 
            content: `As an AI expert, analyze and improve the following chatbot system prompt:

"${currentPrompt}"

Enhance this prompt to:
1. Make it more clear and specific about the chatbot's role
2. Add any missing constraints or guidelines
3. Improve the tone and communication style
4. Add best practices for better interactions

Return only the improved prompt without any explanations or metadata.`
          }
        ],
      });

      const improvedPrompt = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Error: Unexpected response format';

      logger.info("Improved prompt", { improvedPrompt });
      res.json({ prompt: improvedPrompt });

    } catch (err) {
      logger.error("Prompt improvement error:", err);
      res.status(500).json({ 
        error: "Failed to improve prompt",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  // Update the test-prompt endpoint to properly use Claude's message format
  app.post("/api/test-prompt", apiLimiter, async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
        logger.warn("Invalid prompt", { promptLength: prompt?.length, promptType: typeof prompt });
        res.status(400).json({ error: "Invalid prompt format or length" });
        return;
      }

      logger.info("Testing prompt", { prompt });

      const systemKey = await storage.getSystemSetting('ANTHROPIC_API_KEY');
      if (!systemKey) {
        logger.error("No system API key available");
        res.status(500).json({ error: "System API key not configured" });
        return;
      }

      const anthropic = new Anthropic({ apiKey: systemKey });

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          { 
            role: "user", 
            content: `${prompt}\n\nWith that context in mind, respond to this message: Hello! How can you help me today?`
          }
        ],
      });

      const previewResponse = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Error: Unexpected response format';

      logger.info("Preview response", { previewResponse });
      res.json({ response: previewResponse });

    } catch (err) {
      logger.error("Prompt testing error:", err);
      res.status(500).json({ 
        error: "Failed to test prompt",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  // Knowledge base endpoints with upload limiter
  app.post("/api/knowledge-base", uploadLimiter, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, buffer } = req.file;
      const botId = parseInt(req.body.botId);
      if (isNaN(botId)) {
        return res.status(400).json({ error: 'Invalid bot ID' });
      }
      const knowledgeBaseEntry = await storage.createKnowledgeBaseEntry(botId, originalname, buffer);
      res.json(knowledgeBaseEntry);
    } catch(e){
      logger.error('Error creating knowledge base entry', e);
      res.status(500).json({ error: 'Failed to create knowledge base entry' });
    }
  });

  // Get rate limit configuration
  app.get("/api/admin/rate-limits", adminLimiter, async (_req, res) => {
    try {
      const config = {
        api: {
          windowMs: parseInt(await storage.getSystemSetting('RATE_LIMIT_API_WINDOW') || '60000'),
          max: parseInt(await storage.getSystemSetting('RATE_LIMIT_API_MAX') || '100')
        },
        chat: {
          windowMs: parseInt(await storage.getSystemSetting('RATE_LIMIT_CHAT_WINDOW') || '60000'),
          max: parseInt(await storage.getSystemSetting('RATE_LIMIT_CHAT_MAX') || '30')
        },
        admin: {
          windowMs: parseInt(await storage.getSystemSetting('RATE_LIMIT_ADMIN_WINDOW') || '60000'),
          max: parseInt(await storage.getSystemSetting('RATE_LIMIT_ADMIN_MAX') || '20')
        },
        upload: {
          windowMs: parseInt(await storage.getSystemSetting('RATE_LIMIT_UPLOAD_WINDOW') || '60000'),
          max: parseInt(await storage.getSystemSetting('RATE_LIMIT_UPLOAD_MAX') || '10')
        }
      };

      res.json({ config });
    } catch (err) {
      logger.error("Error fetching rate limit config:", err);
      res.status(500).json({ 
        error: "Failed to fetch rate limit configuration",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  // Update rate limit configuration
  app.post("/api/admin/rate-limits", adminLimiter, async (req, res) => {
    try {
      const config = rateLimitConfigSchema.parse(req.body);

      // Save all settings
      await Promise.all([
        storage.setSystemSetting('RATE_LIMIT_API_WINDOW', config.api.windowMs.toString()),
        storage.setSystemSetting('RATE_LIMIT_API_MAX', config.api.max.toString()),
        storage.setSystemSetting('RATE_LIMIT_CHAT_WINDOW', config.chat.windowMs.toString()),
        storage.setSystemSetting('RATE_LIMIT_CHAT_MAX', config.chat.max.toString()),
        storage.setSystemSetting('RATE_LIMIT_ADMIN_WINDOW', config.admin.windowMs.toString()),
        storage.setSystemSetting('RATE_LIMIT_ADMIN_MAX', config.admin.max.toString()),
        storage.setSystemSetting('RATE_LIMIT_UPLOAD_WINDOW', config.upload.windowMs.toString()),
        storage.setSystemSetting('RATE_LIMIT_UPLOAD_MAX', config.upload.max.toString())
      ]);

      // Log the update
      logger.info("Rate limit configuration updated", { config });

      res.json({ success: true });
    } catch (err) {
      logger.error("Error updating rate limit config:", err);
      res.status(500).json({ 
        error: "Failed to update rate limit configuration",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  // Get system logs
  app.get("/api/admin/logs", adminLimiter, async (_req, res) => {
    try {
      const logs = await logger.getRecentLogs();
      res.json(logs);
    } catch (err) {
      logger.error("Error fetching logs", err as Error);
      res.status(500).json({ 
        error: "Failed to fetch logs",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  // Add to existing routes
  app.get("/api/system/health", adminLimiter, async (_req, res) => {
    try {
      // Get system metrics
      const metrics = {
        system: {
          cpuUsage: os.loadavg()[0], // 1 minute load average
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          uptime: os.uptime(),
          platform: os.platform(),
        },
        process: {
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
        }
      };

      // Get API metrics from the last hour
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 1);

      const apiMetrics = await db
        .select({
          total: sql`COUNT(*)`,
          errors: sql`COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END)`,
          avgResponseTime: sql`AVG(response_time)`,
        })
        .from(chatInteractions)
        .where(sql`timestamp >= ${startTime}`);

      // Add API metrics to response
      metrics.api = {
        totalRequests: apiMetrics[0].total,
        errorCount: apiMetrics[0].errors,
        averageResponseTime: apiMetrics[0].avgResponseTime || 0,
        errorRate: apiMetrics[0].total > 0 ? (apiMetrics[0].errors / apiMetrics[0].total) * 100 : 0
      };

      // Add database status
      try {
        await db.select().from(chatInteractions).limit(1);
        metrics.database = {
          status: 'connected',
          healthy: true
        };
      } catch (err) {
        metrics.database = {
          status: 'error',
          healthy: false,
          error: err instanceof Error ? err.message : 'Unknown database error'
        };
      }

      res.json(metrics);
    } catch (err) {
      logger.error("Error fetching system health metrics:", err);
      res.status(500).json({ 
        error: "Failed to fetch system health metrics",
        details: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}