import { describe, expect, it } from "vitest";
import { resolveLLMProviderConfig } from "@/lib/ai/llm-client";

describe("LLM provider config", () => {
  it("defaults to DeepSeek when no provider is set", () => {
    const config = resolveLLMProviderConfig({
      DEEPSEEK_API_KEY: "deepseek-key"
    });

    expect(config.provider).toBe("deepseek");
    expect(config.apiKey).toBe("deepseek-key");
    expect(config.baseUrl).toBe("https://api.deepseek.com");
    expect(config.model).toBe("deepseek-v4-flash");
  });

  it("supports Qwen through DashScope-compatible defaults", () => {
    const config = resolveLLMProviderConfig({
      LLM_PROVIDER: "qwen",
      DASHSCOPE_API_KEY: "qwen-key"
    });

    expect(config.provider).toBe("qwen");
    expect(config.apiKey).toBe("qwen-key");
    expect(config.baseUrl).toBe("https://dashscope.aliyuncs.com/compatible-mode/v1");
    expect(config.model).toBe("qwen-plus");
  });

  it("supports explicit OpenAI-compatible providers", () => {
    const config = resolveLLMProviderConfig({
      LLM_PROVIDER: "openai_compatible",
      LLM_API_KEY: "provider-key",
      LLM_BASE_URL: "https://llm.example.com/v1",
      LLM_MODEL: "custom-model"
    });

    expect(config.provider).toBe("openai_compatible");
    expect(config.apiKey).toBe("provider-key");
    expect(config.baseUrl).toBe("https://llm.example.com/v1");
    expect(config.model).toBe("custom-model");
  });

  it("can disable JSON mode for compatible APIs that do not support response_format", () => {
    const config = resolveLLMProviderConfig({
      LLM_PROVIDER: "deepseek",
      LLM_API_KEY: "key",
      LLM_JSON_MODE: "false"
    });

    expect(config.jsonMode).toBe(false);
  });
});
