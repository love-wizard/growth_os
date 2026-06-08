import OpenAI from "openai";
import "server-only";
import type { ChatCompletion } from "openai/resources/chat/completions";

export type LLMProvider = "deepseek" | "qwen" | "openai" | "openai_compatible";
type LLMEnv = Partial<NodeJS.ProcessEnv> & Record<string, string | undefined>;

export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  jsonMode: boolean;
}

export interface StructuredLLMInput {
  instructions: string;
  input: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  model?: string;
}

export function resolveLLMProviderConfig(
  env: LLMEnv = process.env
): LLMProviderConfig {
  const provider = resolveProvider(env);

  return {
    provider,
    apiKey: resolveApiKey(provider, env),
    baseUrl: resolveBaseUrl(provider, env),
    model: resolveModel(provider, env),
    jsonMode: env.LLM_JSON_MODE !== "false"
  };
}

export function createLLMClient(config = resolveLLMProviderConfig()) {
  if (!config.apiKey) {
    throw new Error(`Missing API key for LLM provider: ${config.provider}`);
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl
  });
}

export function hasConfiguredLLM(env: LLMEnv = process.env) {
  return Boolean(resolveLLMProviderConfig(env).apiKey);
}

export async function createStructuredLLMCompletion(
  client: OpenAI,
  request: StructuredLLMInput,
  config = resolveLLMProviderConfig()
): Promise<ChatCompletion> {
  return client.chat.completions.create({
    model: request.model ?? config.model,
    messages: [
      {
        role: "system",
        content: `${request.instructions}

Return only valid JSON. The JSON object must match this schema named ${request.schemaName}: ${JSON.stringify(
          request.jsonSchema
        )}`
      },
      {
        role: "user",
        content: request.input
      }
    ],
    response_format: config.jsonMode ? { type: "json_object" } : undefined,
    stream: false
  });
}

export function parseLLMCompletionJson<T>(completion: ChatCompletion): T {
  const outputText = getLLMCompletionOutputText(completion);

  if (!outputText) {
    throw new Error("LLM response did not include output text");
  }

  return JSON.parse(outputText) as T;
}

export function getLLMCompletionOutputText(completion: ChatCompletion) {
  return completion.choices[0]?.message.content ?? "";
}

function resolveProvider(env: LLMEnv): LLMProvider {
  const configuredProvider = env.LLM_PROVIDER;

  if (isSupportedLLMProvider(configuredProvider)) {
    return configuredProvider;
  }

  if (env.OPENAI_API_KEY) {
    return "openai";
  }

  if (env.QWEN_API_KEY || env.DASHSCOPE_API_KEY) {
    return "qwen";
  }

  return "deepseek";
}

function resolveApiKey(provider: LLMProvider, env: LLMEnv) {
  if (env.LLM_API_KEY) {
    return env.LLM_API_KEY;
  }

  if (provider === "openai") {
    return env.OPENAI_API_KEY;
  }

  if (provider === "deepseek") {
    return env.DEEPSEEK_API_KEY;
  }

  if (provider === "qwen") {
    return env.QWEN_API_KEY ?? env.DASHSCOPE_API_KEY;
  }

  return undefined;
}

function resolveBaseUrl(provider: LLMProvider, env: LLMEnv) {
  if (env.LLM_BASE_URL) {
    return env.LLM_BASE_URL;
  }

  if (provider === "deepseek") {
    return env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  }

  if (provider === "qwen") {
    return (
      env.QWEN_BASE_URL ??
      env.DASHSCOPE_BASE_URL ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1"
    );
  }

  if (provider === "openai_compatible") {
    return env.OPENAI_COMPATIBLE_BASE_URL;
  }

  return undefined;
}

function resolveModel(provider: LLMProvider, env: LLMEnv) {
  if (env.LLM_MODEL) {
    return env.LLM_MODEL;
  }

  if (provider === "openai") {
    return env.OPENAI_MODEL ?? "gpt-4.1-mini";
  }

  if (provider === "deepseek") {
    return env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
  }

  if (provider === "qwen") {
    return env.QWEN_MODEL ?? env.DASHSCOPE_MODEL ?? "qwen-plus";
  }

  return env.OPENAI_COMPATIBLE_MODEL ?? "gpt-4.1-mini";
}

function isSupportedLLMProvider(value: string | undefined): value is LLMProvider {
  return (
    value === "deepseek" ||
    value === "qwen" ||
    value === "openai" ||
    value === "openai_compatible"
  );
}
