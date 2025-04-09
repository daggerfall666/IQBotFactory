import { OpenRouterClient } from "openrouter-kit";
import type { Message, ChatConfig } from "@shared/types/chat";

export class OpenRouterService {
  private defaultModel: string = "openai/gpt-3.5-turbo"; // Modelo padrão

  private getClient(apiKey?: string): OpenRouterClient {
    // Use a chave API fornecida ou use a variável de ambiente como fallback
    const key = apiKey || process.env["OPENROUTER_API_KEY"];
    
    if (!key) {
      throw new Error("No OpenRouter API key provided");
    }
    
    return new OpenRouterClient({
      apiKey: key,
      apiEndpoint: "https://openrouter.ai/api/v1",
    });
  }

  async chat(messages: Message[], config?: Partial<ChatConfig>): Promise<Message> {
    try {
      // Use o modelo especificado ou o padrão
      const modelName = config?.model || this.defaultModel;
      const apiKey = config?.apiKey;
      
      console.log(`Using OpenRouter model: ${modelName}`);
      
      // Inicializa o cliente com a chave API do usuário, se fornecida
      const client = this.getClient(apiKey);
      
      // Converte mensagens para o formato esperado pelo OpenRouter
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // A biblioteca espera um "prompt" ou "customMessages"
      const response = await client.chat({
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

  async listModels(apiKey?: string): Promise<any> {
    try {
      const key = apiKey || process.env["OPENROUTER_API_KEY"];
      
      if (!key) {
        throw new Error("No OpenRouter API key provided");
      }
      
      // Fazer uma chamada direta à API OpenRouter para listar modelos
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env["REPLIT_DOMAIN"] || "https://replit.app",
          "X-Title": "Chatbot Platform"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching models: ${response.status} ${errorText}`);
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Retrieved OpenRouter models:", data.data.length);
      return data;
    } catch (error) {
      console.error("Error listing OpenRouter models:", error);
      // Em caso de erro, retornamos uma lista mínima de modelos conhecidos
      return {
        data: [
          { id: "openai/gpt-3.5-turbo", context_length: 16385 },
          { id: "openai/gpt-4", context_length: 8192 },
          { id: "openai/gpt-4o", context_length: 8192 },
          { id: "openai/gpt-4-turbo", context_length: 16384 },
          { id: "anthropic/claude-3-opus", context_length: 200000 },
          { id: "anthropic/claude-3-sonnet", context_length: 180000 },
          { id: "anthropic/claude-3-haiku", context_length: 80000 },
          { id: "anthropic/claude-3.5-sonnet", context_length: 200000 },
          { id: "google/gemini-2.5-flash", context_length: 1000000 },
          { id: "google/gemini-2.5-pro", context_length: 1000000 },
          { id: "meta-llama/llama-3-70b-instruct", context_length: 8192 },
          { id: "meta-llama/llama-3-8b-instruct", context_length: 8192 },
          { id: "mistralai/mistral-large", context_length: 32768 },
          { id: "mistralai/mistral-small", context_length: 32768 },
          { id: "mistralai/mistral-7b-instruct", context_length: 8192 },
          { id: "mistralai/mixtral-8x7b-instruct", context_length: 32768 }
        ]
      };
    }
  }
}

// Exporta uma instância singleton
export const openRouterService = new OpenRouterService();