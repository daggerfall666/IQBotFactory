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