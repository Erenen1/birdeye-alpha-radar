/**
 * services/ml/client.ts
 * =====================
 * Client for communicating with the Python FastAPI ML microservice.
 * Encapsulates all fetch logic so API routes stay thin and readable.
 */
import { MLPredictionResult, TokenData } from "@/types";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";

interface MLPredictResponse {
  success: boolean;
  data: MLPredictionResult[];
  count: number;
  detail?: string;
}

/**
 * Sends a batch of tokens to the Python ML service and returns predictions.
 * Returns null if the service is unreachable (caller handles fallback).
 */
export async function predictTokens(tokens: TokenData[]): Promise<MLPredictionResult[] | null> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens }),
    });

    const json: MLPredictResponse = await res.json();

    if (json.success) {
      return json.data;
    }

    console.warn("ML Service returned failure:", json.detail ?? "Unknown error");
    return null;
  } catch (error) {
    console.warn("Python ML Service unreachable. Falling back to raw token data.", error);
    return null;
  }
}

/**
 * Merges ML prediction results back onto their originating token objects.
 */
export function mergeMLResults(tokens: TokenData[], predictions: MLPredictionResult[]): TokenData[] {
  return tokens.map((token) => {
    const ml = predictions.find((p) => p.address === token.address);
    return ml ? { ...token, ...ml } : token;
  });
}
