/**
 * Server Configuration - Secure key resolution
 * Priority: process.env.OPENAI_API_KEY > decoded OAI_B64 env var
 */

export function getConfig(key: string): string | undefined {
    // 1. Direct env var (highest priority)
    if (process.env[key]) return process.env[key];

    // 2. For OpenAI: check alternate names and encoded fallback
    if (key === "OPENAI_API_KEY") {
        if (process.env.OPENAI) return process.env.OPENAI;

        // Decode from base64 env var (secure injection)
        if (process.env.OAI_B64) {
            try {
                return Buffer.from(process.env.OAI_B64, "base64").toString("utf-8");
            } catch {
                return undefined;
            }
        }
    }

    return undefined;
}
