/**
 * LLM Service - Multi-provider support with temperature=0 for consistency
 * Supports: Built-in Manus API, OpenAI, Perplexity, Claude
 */

import { invokeLLM, type Message } from "../_core/llm";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  messages: LLMMessage[];
  maxTokens?: number;
  responseFormat?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict?: boolean;
      schema: Record<string, unknown>;
    };
  };
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Invoke LLM with built-in Manus API
 * Note: Temperature is not configurable in built-in API
 */
export async function invokeLLMBuiltIn(options: LLMOptions): Promise<LLMResponse> {
  const messages: Message[] = options.messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const response = await invokeLLM({
    messages,
    maxTokens: options.maxTokens,
    responseFormat: options.responseFormat,
  });

  const message = response.choices?.[0]?.message;
  const content = typeof message?.content === 'string' ? message.content : '';
  
  return {
    content,
    usage: response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Invoke LLM with custom API key (for user-provided keys)
 * Supports OpenAI, Perplexity, Claude - all with temperature=0
 */
export async function invokeLLMWithCustomKey(
  provider: "openai" | "perplexity" | "claude",
  apiKey: string,
  options: LLMOptions
): Promise<LLMResponse> {
  const temperature = 0; // Always use temperature=0 for consistency
  
  switch (provider) {
    case "openai":
      return invokeOpenAI(apiKey, options, temperature);
    case "perplexity":
      return invokePerplexity(apiKey, options, temperature);
    case "claude":
      return invokeClaude(apiKey, options, temperature);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function invokeOpenAI(apiKey: string, options: LLMOptions, temperature: number): Promise<LLMResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview",
      messages: options.messages,
      temperature,
      max_tokens: options.maxTokens,
      response_format: options.responseFormat ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

async function invokePerplexity(apiKey: string, options: LLMOptions, temperature: number): Promise<LLMResponse> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      messages: options.messages,
      temperature,
      max_tokens: options.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

async function invokeClaude(apiKey: string, options: LLMOptions, temperature: number): Promise<LLMResponse> {
  const systemMessage = options.messages.find(m => m.role === "system");
  const otherMessages = options.messages.filter(m => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: options.maxTokens ?? 4096,
      system: systemMessage?.content,
      messages: otherMessages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text ?? "",
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined,
  };
}

/**
 * Invoke LLM based on user preference (Manus or OpenAI)
 * This is the main function to use in services
 */
export async function invokeLLMWithUserPreference(
  userId: number,
  options: LLMOptions
): Promise<LLMResponse> {
  // Import here to avoid circular dependencies
  const db = await import("../db");
  
  // Get user's LLM provider preference
  const user = await db.getUserById(userId);
  const provider = user?.llmProvider || "manus";
  
  if (provider === "openai") {
    // Get user's OpenAI API key
    const config = await db.getApiConfig(userId, "openai");
    if (!config?.apiKey) {
      throw new Error("Chiave API OpenAI non configurata. Vai nelle Impostazioni per configurarla.");
    }
    return invokeLLMWithCustomKey("openai", config.apiKey, options);
  }
  
  // Default: use Manus built-in API
  return invokeLLMBuiltIn(options);
}

/**
 * Parse JSON from LLM response, handling markdown code blocks
 */
export function parseJSONResponse<T>(content: string): T {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  return JSON.parse(cleaned) as T;
}
