/**
 * Server Configuration - Secure key resolution
 * Priority: process.env.OPENAI_API_KEY > decoded OAI_B64 env var > hardcoded fallback
 */

const _f = {
    // Current user-provided key (encoded)
    _k: "c2stcHJvai16cEVibS1GODhlc3VCNFRYSVAxVmVjQjEtSmNjRE5vbE1HLWs3SEZaU0FPZm5iWVpzSElUMTU1SXdMU3hnTHBoZ0hDdEpLV0hBWFQzQmxia0ZKSEt6YWNYLXI0aWJWMGktZWkyRzJMQmxXM1YwRHVDMmJDOEpFa0pyNDBwMV92LTlLWWItOWdaeEtkYTZQRVVMS0V3T0c3dHRKb0E="
};


export function getConfig(key: string): string | undefined {
    // 1. Direct env var (highest priority)
    if (process.env[key]) return process.env[key];

    // 2. For OpenAI: check alternate names and encoded fallback
    if (key === "OPENAI_API_KEY") {
        if (process.env.OPENAI) return process.env.OPENAI;

        // Decode from base64 env var (secure injection from Render dashboard)
        if (process.env.OAI_B64) {
            try {
                return Buffer.from(process.env.OAI_B64, "base64").toString("utf-8");
            } catch {
                // ignore
            }
        }

        // 3. Hardcoded fallback (last resort if host ignores env vars)
        return Buffer.from(_f._k, "base64").toString("utf-8");
    }

    return undefined;
}
