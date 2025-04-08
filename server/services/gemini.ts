import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Message, ChatConfig } from "@shared/types/chat";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY is not set");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = "gemini-pro";
  }

  async chat(messages: Message[], config?: Partial<ChatConfig>) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      const chat = model.startChat({
        generationConfig: {
          temperature: config?.temperature ?? 0.7,
          maxOutputTokens: config?.maxOutputTokens ?? 2048,
        },
      });

      // Convert messages to the format expected by Gemini
      const history = messages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Send the messages to Gemini
      const result = await chat.sendMessageStream(history[history.length - 1].parts[0].text);
      
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

  async generateImage(prompt: string): Promise<string> {
    throw new Error("Image generation not yet supported by Gemini Free API");
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
