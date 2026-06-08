import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";

type SupabaseSession = {
  access_token: string;
  user: {
    id: string;
  };
};

const env = loadLocalEnv();
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function signInE2EUser(page: Page) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase local env is required for authenticated E2E tests");
  }

  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `growthos-e2e-${unique}@example.com`;
  const password = `GrowthOS-${unique}!`;
  const signup = await authFetch("/signup", { email, password });
  const session = signup.session
    ? (signup as SupabaseSession)
    : await authFetch("/token?grant_type=password", { email, password });

  await page.context().addCookies(
    createSessionCookies(session as SupabaseSession).map((cookie) => ({
      ...cookie,
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax" as const
    }))
  );
}

async function authFetch(path: string, body: Record<string, string>) {
  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase auth ${path} failed: ${text}`);
  }

  return JSON.parse(text) as SupabaseSession & {
    session?: SupabaseSession;
  };
}

function createSessionCookies(session: SupabaseSession) {
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
  const encoded =
    "base64-" +
    Buffer.from(JSON.stringify(session), "utf8").toString("base64url");

  return createChunks(storageKey, encoded);
}

function createChunks(key: string, value: string, chunkSize = 3180) {
  let encodedValue = encodeURIComponent(value);

  if (encodedValue.length <= chunkSize) {
    return [{ name: key, value }];
  }

  const chunks: string[] = [];

  while (encodedValue.length > 0) {
    let encodedChunkHead = encodedValue.slice(0, chunkSize);
    const lastEscapePos = encodedChunkHead.lastIndexOf("%");

    if (lastEscapePos > chunkSize - 3) {
      encodedChunkHead = encodedChunkHead.slice(0, lastEscapePos);
    }

    let valueHead = "";
    while (encodedChunkHead.length > 0) {
      try {
        valueHead = decodeURIComponent(encodedChunkHead);
        break;
      } catch (error) {
        if (
          error instanceof URIError &&
          encodedChunkHead.at(-3) === "%" &&
          encodedChunkHead.length > 3
        ) {
          encodedChunkHead = encodedChunkHead.slice(0, encodedChunkHead.length - 3);
        } else {
          throw error;
        }
      }
    }

    chunks.push(valueHead);
    encodedValue = encodedValue.slice(encodedChunkHead.length);
  }

  return chunks.map((chunk, index) => ({ name: `${key}.${index}`, value: chunk }));
}

function loadLocalEnv() {
  try {
    return Object.fromEntries(
      readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1)];
        })
    );
  } catch {
    return {};
  }
}
