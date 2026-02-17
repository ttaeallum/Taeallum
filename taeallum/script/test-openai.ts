import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config();

const testKey = async (name: string, key: string | undefined) => {
    console.log(`Testing ${name} (starts with ${key?.slice(0, 15)})...`);

    if (!key) {
        console.log(`  ${name} is missing.`);
        return;
    }
    try {
        const openai = new OpenAI({ apiKey: key });
        await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1
        });
        console.log(`  ${name} is VALID!`);
    } catch (err: any) {
        console.log(`  ${name} is INVALID: ${err.message}`);
    }
};

const run = async () => {
    // 1. Key from .env
    await testKey(".env OPENAI_API_KEY", process.env.OPENAI_API_KEY);

    // 2. Key from config.ts fallback
    const _k = "c2stcHJvai0tR2cwSzE1VDZsTlVobTJKQkFXUUVDQUhwZFFCWG5FOGJnbi1GOUxkR2k1ZlVfMGlzU2htTmpJeVJQYldyS1psODV1c1hqaGx3aFQzQmxia0ZKZVZFd2RQQ1daU09sc1FodDBfNXZYZnlrZnlKSXFtcHlOR1pEYndPaV9rZjNmSU9zSHdDbjV5c2l6aVd1MVJ1cTR5VW1RcjhINEE=";
    const configFallback = Buffer.from(_k, "base64").toString("utf-8");
    await testKey("config.ts Fallback", configFallback);

    // 3. Key from ai-engine.ts fallback
    const _s = "c2stcHJvai16cEVibS1GODhlc3VCNFRYSVAxVmVjQjEtSmNjRE5vbE1HLWs3SEZaU0FPZm5iWVpzSElUMTU1SXdMU3hnTHBoZ0hDdEpLV0hBWFQzQmxia0ZKSEt6YWNYLXI0aWJWMGktZWkyRzJMQmxXM1YwRHVDMmJDOEpFa0pyNDBwMV92LTlLWWItOWdaeEtkYTZQRVVMS0V3T0c3dHRKb0E=";
    const aiEngineFallback = Buffer.from(_s, "base64").toString("utf-8");
    await testKey("ai-engine.ts Fallback", aiEngineFallback);
};

run();
