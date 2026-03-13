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
// Note: We use 'text-embedding-004' but explicit prefix sometimes help
export const geminiEmbed = genAI.getGenerativeModel({
  model: "text-embedding-004"
});
