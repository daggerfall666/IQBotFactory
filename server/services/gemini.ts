import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Message, ChatConfig } from "@shared/types/chat";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;

  constructor() {
    const apiKey = process.env['GOOGLE_AI_API_KEY'];
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY is not set");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.defaultModel = "gemini-2.0-flash"; // Set the latest model as default
  }

  async chat(messages: Message[], config?: Partial<ChatConfig>): Promise<Message> {
    try {
      // Use specified model or default
      const modelName = config?.model || this.defaultModel;
      
      console.log(`Using Gemini model: ${modelName}`);
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
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

  async generateImage(_prompt: string): Promise<string> {
    throw new Error("Image generation not yet supported by Gemini Free API");
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
