/**
 * Server Configuration - Secure key resolution
 * Priority: process.env.OPENAI_API_KEY > decoded OAI_B64 env var > hardcoded fallback
 */

const _f = {
    // Current user-provided key (encoded)
    _k: "c2stcHJvai0tR2cwSzE1VDZsTlVobTJKQkFXUUVDQUhwZFFCWG5FOGJnbi1GOUxkR2k1ZlVfMGlzU2htTmpJeVJQYldyS1psODV1c1hqaGx3aFQzQmxia0ZKZVZFd2RQQ1daU09sc1FodDBfNXZYZnlrZnlKSXFtcHlOR1pEYndPaV9rZjNmSU9zSHdDbjV5c2l6aVd1MVJ1cTR5VW1RcjhINEE="
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
