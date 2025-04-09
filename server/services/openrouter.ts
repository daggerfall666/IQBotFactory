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
      
      console.log("Fetching OpenRouter models with key:", key ? "Key provided" : "No key");
      
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
      
      // Format the models for easier consumption
      const formattedData = {
        data: data.data.map((model: any) => ({
          id: model.id,
          name: model.name || model.id.split('/').pop(),
          context_length: model.context_length,
          description: model.description || '',
          // Group models by provider
          provider: model.id.split('/')[0],
          // Add details like pricing if available
          pricing: model.pricing || {}
        }))
      };
      
      // Sort models by provider and then by name
      formattedData.data.sort((a: any, b: any) => {
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider);
        }
        return a.name.localeCompare(b.name);
      });
      
      return formattedData;
    } catch (error) {
      console.error("Error listing OpenRouter models:", error);
      // Em caso de erro, retornamos uma lista avançada de modelos conhecidos
      const fallbackModels = [
        // OpenAI models
        { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo", context_length: 16385, provider: "openai" },
        { id: "openai/gpt-4", name: "GPT-4", context_length: 8192, provider: "openai" },
        { id: "openai/gpt-4o", name: "GPT-4o", context_length: 8192, provider: "openai" },
        { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", context_length: 16384, provider: "openai" },
        
        // Anthropic models
        { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", context_length: 200000, provider: "anthropic" },
        { id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet", context_length: 180000, provider: "anthropic" },
        { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", context_length: 80000, provider: "anthropic" },
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", context_length: 200000, provider: "anthropic" },
        
        // Google models
        { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", context_length: 1000000, provider: "google" },
        { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", context_length: 1000000, provider: "google" },
        { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro", context_length: 1000000, provider: "google" },
        { id: "google/gemini-1.5-flash", name: "Gemini 1.5 Flash", context_length: 128000, provider: "google" },
        
        // Meta models
        { id: "meta-llama/llama-3-70b-instruct", name: "Llama 3 70B", context_length: 8192, provider: "meta-llama" },
        { id: "meta-llama/llama-3-8b-instruct", name: "Llama 3 8B", context_length: 8192, provider: "meta-llama" },
        
        // Mistral models
        { id: "mistralai/mistral-large", name: "Mistral Large", context_length: 32768, provider: "mistralai" },
        { id: "mistralai/mistral-small", name: "Mistral Small", context_length: 32768, provider: "mistralai" },
        { id: "mistralai/mistral-7b-instruct", name: "Mistral 7B", context_length: 8192, provider: "mistralai" },
        { id: "mistralai/mixtral-8x7b-instruct", name: "Mixtral 8x7B", context_length: 32768, provider: "mistralai" }
      ];
      
      return { data: fallbackModels };
    }
  }
}

// Exporta uma instância singleton
export const openRouterService = new OpenRouterService();