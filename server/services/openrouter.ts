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
      
      console.log(`Using OpenRouter model: ${modelName}, with API key: ${apiKey ? 'Provided' : 'From env'}`);
      console.log(`Message count: ${messages.length}`);
      
      // Validar que temos mensagens antes de prosseguir
      if (!messages || messages.length === 0) {
        throw new Error("No messages provided");
      }

      // Inicializa o cliente com a chave API do usuário, se fornecida
      const client = this.getClient(apiKey);
      
      // Converte mensagens para o formato esperado pelo OpenRouter
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      console.log(`Sending to OpenRouter model: ${modelName}`);

      // Tratamento especial para modelos específicos se necessário
      let response;
      try {
        // A biblioteca espera um "prompt" ou "customMessages"
        response = await client.chat({
          model: modelName,
          customMessages: formattedMessages,
          temperature: config?.temperature ?? 0.7,
          maxTokens: config?.maxOutputTokens ?? 1024,
        });
      } catch (chatError: any) {
        console.error(`OpenRouter chat error for model ${modelName}:`, chatError);
        
        // Se for um erro relacionado ao modelo, tente com o modelo padrão
        if (modelName !== this.defaultModel && chatError.message?.includes('model')) {
          console.log(`Retrying with default model: ${this.defaultModel}`);
          response = await client.chat({
            model: this.defaultModel,
            customMessages: formattedMessages,
            temperature: config?.temperature ?? 0.7,
            maxTokens: config?.maxOutputTokens ?? 1024,
          });
        } else {
          // Se não for relacionado ao modelo ou estamos usando o padrão, relance o erro
          throw chatError;
        }
      }

      if (!response || !response.content) {
        console.error("Empty response from OpenRouter");
        throw new Error("Empty response from OpenRouter");
      }

      console.log("OpenRouter response received successfully");
      
      // A resposta já vem formatada pela biblioteca
      return {
        role: "assistant",
        content: response.content,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Error in OpenRouter chat:", error.message || error);
      // Retorne uma mensagem de erro mais amigável
      throw new Error(`Erro ao comunicar com o modelo: ${error.message || 'Erro desconhecido'}`);
    }
  }

  async listModels(apiKey?: string): Promise<any> {
    try {
      const key = apiKey || process.env["OPENROUTER_API_KEY"];
      
      if (!key) {
        console.warn("No OpenRouter API key provided, using fallback models");
        return this.getFallbackModels();
      }
      
      console.log("Fetching OpenRouter models with API key");
      
      try {
        // Fazer uma chamada direta à API OpenRouter para listar modelos com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundo timeout
        
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env["REPLIT_DOMAIN"] || "https://replit.app",
            "X-Title": "Chatbot Platform"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching models: ${response.status} ${errorText}`);
          return this.getFallbackModels();
        }
        
        const data = await response.json();
        
        if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
          console.warn("OpenRouter returned empty or invalid data");
          return this.getFallbackModels();
        }
        
        console.log("Retrieved OpenRouter models:", data.data.length);
        
        // Format the models for easier consumption
        const formattedData = {
          data: data.data.map((model: any) => ({
            id: model.id,
            name: model.name || model.id.split('/').pop(),
            context_length: model.context_length || 4096,
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
      } catch (fetchError) {
        console.error("Error fetching from OpenRouter API:", fetchError);
        return this.getFallbackModels();
      }
    } catch (error) {
      console.error("Error in listModels method:", error);
      return this.getFallbackModels();
    }
  }
  
  // Método separado para retornar modelos de fallback
  private getFallbackModels() {
    console.log("Using fallback models list");
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

// Exporta uma instância singleton
export const openRouterService = new OpenRouterService();