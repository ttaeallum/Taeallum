import { GoogleGenerativeAI } from "@google/generative-ai";
import { getConfig } from "../config";

const rawKey = getConfig("GEMINI_API_KEY");
const key = rawKey?.trim();

if (!key) {
    console.warn("[GEMINI] No GEMINI_API_KEY found in config.");
}

const genAI = new GoogleGenerativeAI(key || "");

// للنصوص فقط
export const geminiPro = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro" 
});

// للفيديو + نص
export const geminiVideo = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro" 
});

// لتمحيص النصوص (Embeddings)
// Note: Using embedding-001 for maximum compatibility. 
// It returns 768 dimensions which matches our new DB schema.
export const geminiEmbed = genAI.getGenerativeModel({
  model: "embedding-001"
});
