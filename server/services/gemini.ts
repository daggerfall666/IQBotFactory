import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Message, ChatConfig } from "@shared/types/chat";

export class GeminiService {
  private defaultModel: string = "gemini-2.5-flash"; // Set the latest model as default

  private getClient(apiKey?: string): GoogleGenerativeAI {
    // Use the provided API key or fall back to environment variable
    const key = apiKey || process.env["GOOGLE_AI_API_KEY"];
    
    if (!key) {
      throw new Error("No Google AI API key provided");
    }
    
    return new GoogleGenerativeAI(key);
  }

  async chat(messages: Message[], config?: Partial<ChatConfig>): Promise<Message> {
    try {
      // Use specified model or default
      const modelName = config?.model || this.defaultModel;
      const apiKey = config?.apiKey;
      
      console.log(`Using Gemini model: ${modelName}`);
      
      // Initialize client with user's API key if provided
      const genAI = this.getClient(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const chat = model.startChat({
        generationConfig: {
          temperature: config?.temperature ?? 0.7,
          maxOutputTokens: config?.maxOutputTokens ?? 4096,
        },
      });

      // Convert messages to the format expected by Gemini
      const history = messages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Make sure there's at least one message
      if (history.length === 0) {
        throw new Error("No messages to send");
      }
      
      const lastMessage = history[history.length - 1];
      
      if (!lastMessage || !lastMessage.parts || !lastMessage.parts[0] || typeof lastMessage.parts[0].text !== 'string') {
        throw new Error("Invalid message format");
      }
      
      // Send the messages to Gemini
      const result = await chat.sendMessageStream(lastMessage.parts[0].text);
      
      let response = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        response += chunkText;
      }
      
      return {
        role: "assistant" as const,
        content: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error in Gemini chat:", error);
      throw error;
    }
  }

  async listModels(apiKey?: string): Promise<any> {
    try {
      // Podemos retornar uma lista de modelos diretamente, já que o Google não fornece uma API para listar modelos
      // Esta é uma lista atualizada com os modelos mais recentes da Gemini
      return {
        data: [
          { id: "gemini-2.5-flash", context_length: 1000000 },
          { id: "gemini-2.5-pro", context_length: 1000000 },
          { id: "gemini-2.0-flash", context_length: 16384 },
          { id: "gemini-2.0-flash-001", context_length: 16384 },
          { id: "gemini-2.0-flash-lite", context_length: 16384 },
          { id: "gemini-2.0-flash-lite-001", context_length: 16384 },
          { id: "gemini-1.5-pro", context_length: 2000000 },
          { id: "gemini-1.5-pro-001", context_length: 2000000 },
          { id: "gemini-1.5-pro-002", context_length: 2000000 },
          { id: "gemini-1.5-flash", context_length: 1000000 },
          { id: "gemini-1.5-flash-001", context_length: 1000000 },
          { id: "gemini-1.5-flash-002", context_length: 1000000 }
        ]
      };
    } catch (error) {
      console.error("Error listing Gemini models:", error);
      return {
        data: [
          { id: "gemini-2.5-flash", context_length: 1000000 },
          { id: "gemini-2.5-pro", context_length: 1000000 },
          { id: "gemini-2.0-flash", context_length: 16384 },
          { id: "gemini-1.5-pro", context_length: 2000000 },
          { id: "gemini-1.5-flash", context_length: 1000000 }
        ]
      };
    }
  }

  async generateImage(_prompt: string): Promise<string> {
    throw new Error("Image generation not yet supported by Gemini Free API");
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
