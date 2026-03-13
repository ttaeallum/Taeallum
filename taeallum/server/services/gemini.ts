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
  model: "gemini-2.5-pro" // Matches available models in this project
});

// للفيديو + نص
export const geminiVideo = genAI.getGenerativeModel({ 
  model: "gemini-2.5-pro" 
});

// لتمحيص النصوص (Embeddings)
export const geminiEmbed = genAI.getGenerativeModel({
  model: "gemini-embedding-001" // Matches available models in this project
});
