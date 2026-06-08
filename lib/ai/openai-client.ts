import OpenAI from "openai";
import type {
  Response,
  ResponseCreateParamsNonStreaming
} from "openai/resources/responses/responses";

export const defaultOpenAIModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

export function createOpenAIClient(apiKey = process.env.OPENAI_API_KEY) {
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

export interface StructuredResponseInput {
  instructions: string;
  input: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  model?: string;
}

export async function createStructuredResponse(
  client: OpenAI,
  request: StructuredResponseInput
): Promise<Response> {
  const body: ResponseCreateParamsNonStreaming = {
    model: request.model ?? defaultOpenAIModel,
    instructions: request.instructions,
    input: request.input,
    text: {
      format: {
        type: "json_schema",
        name: request.schemaName,
        schema: request.jsonSchema,
        strict: true
      }
    }
  };

  return client.responses.create(body);
}

export function parseResponseJson<T>(response: Response): T {
  const outputText = getResponseOutputText(response);

  if (!outputText) {
    throw new Error("OpenAI response did not include output text");
  }

  return JSON.parse(outputText) as T;
}

export function getResponseOutputText(response: Response) {
  const withOutputText = response as Response & { output_text?: string };
  return withOutputText.output_text ?? "";
}
