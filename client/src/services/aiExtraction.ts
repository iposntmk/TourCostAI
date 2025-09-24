import type { ExtractionResult, MasterData } from "../types";
import { simulateGeminiExtraction } from "../utils/extraction";

const NS = (import.meta.env.VITE_STORAGE_NAMESPACE as string) || "tourcostai";

export const apiKeyStorageKey = `${NS}/ai-api-key`;
export const apiModeStorageKey = `${NS}/ai-api-mode`; // 'mock' | 'live'

export function saveApiKey(key: string) {
  try {
    localStorage.setItem(apiKeyStorageKey, key);
  } catch {
    // ignore
  }
}

export function loadApiKey(): string {
  try {
    return localStorage.getItem(apiKeyStorageKey) ?? "";
  } catch {
    return "";
  }
}

export function saveApiMode(mode: "mock" | "live") {
  try {
    localStorage.setItem(apiModeStorageKey, mode);
  } catch {
    // ignore
  }
}

export function loadApiMode(): "mock" | "live" {
  try {
    return (localStorage.getItem(apiModeStorageKey) as "mock" | "live") ||
      ((import.meta.env.VITE_API_MODE as "mock" | "live") || "mock");
  } catch {
    return (import.meta.env.VITE_API_MODE as "mock" | "live") || "mock";
  }
}

/**
 * Placeholder live extraction. Replace with a real API call.
 * Suggested backend approach: POST multipart/form-data to your server, where the server calls Gemini/Vertex AI.
 */
export async function extractWithAI(
  file: File,
  _masterData: MasterData,
  apiKey: string,
): Promise<ExtractionResult> {
  if (!apiKey) {
    throw new Error("API key is required for live extraction");
  }

  // TODO: Implement real call. Example sketch (server-side recommended):
  // const form = new FormData();
  // form.append("file", file);
  // const res = await fetch("/api/extract", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${apiKey}` },
  //   body: form,
  // });
  // if (!res.ok) throw new Error("Extraction failed");
  // const data = (await res.json()) as ExtractionResult;
  // return data;

  // For now, fall back to simulator so the UI continues to work.
  await new Promise((r) => setTimeout(r, 900));
  return simulateGeminiExtraction(_masterData);
}
