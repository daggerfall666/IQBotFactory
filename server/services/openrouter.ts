import { OpenRouterClient } from "openrouter-kit";
import type { Message, ChatConfig } from "@shared/types/chat";

export class OpenRouterService {
  private client: OpenRouterClient;
  private defaultModel: string;

  constructor() {
    const apiKey = process.env['OPENROUTER_API_KEY'];
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }
    this.client = new OpenRouterClient({
      apiKey,
      apiEndpoint: "https://openrouter.ai/api/v1", // Usando apiEndpoint em vez de baseUrl
    });
    this.defaultModel = "openai/gpt-3.5-turbo"; // Modelo padrão
  }

  async chat(messages: Message[], config?: Partial<ChatConfig>): Promise<Message> {
    try {
      // Use o modelo especificado ou o padrão
      const modelName = config?.model || this.defaultModel;
      
      console.log(`Using OpenRouter model: ${modelName}`);
      
      // Converte mensagens para o formato esperado pelo OpenRouter
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // A biblioteca espera um "prompt" ou "customMessages"
      const response = await this.client.chat({
        model: modelName,
        customMessages: formattedMessages,
        temperature: config?.temperature ?? 0.7,
      });

      // A resposta já vem formatada pela biblioteca
      return {
        role: "assistant",
        content: response.content || "No response content",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error in OpenRouter chat:", error);
      throw error;
    }
  }

  async listModels(): Promise<any> {
    // A API OpenRouter não possui método direto para listar modelos na biblioteca
    // Poderíamos implementar uma chamada direta à API se necessário
    try {
      // Retornamos apenas os modelos que já definimos no schema
      return {
        data: {
          models: [
            { id: "openai/gpt-3.5-turbo" },
            { id: "openai/gpt-4" },
            { id: "openai/gpt-4o" },
            { id: "openai/gpt-4-turbo" },
            { id: "anthropic/claude-3-opus" },
            { id: "anthropic/claude-3-sonnet" },
            { id: "anthropic/claude-3-haiku" },
            { id: "meta-llama/llama-3-70b-instruct" },
            { id: "meta-llama/llama-3-8b-instruct" },
            { id: "mistralai/mistral-large" },
            { id: "mistralai/mistral-small" },
            { id: "mistralai/mistral-7b-instruct" },
            { id: "mistralai/mixtral-8x7b-instruct" }
          ]
        }
      };
    } catch (error) {
      console.error("Error listing OpenRouter models:", error);
      throw error;
    }
  }
}

// Exporta uma instância singleton
export const openRouterService = new OpenRouterService();