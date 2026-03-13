import { GoogleGenerativeAI } from "@google/generative-ai";
import { getConfig } from "../config";

const key = getConfig("GEMINI_API_KEY") || getConfig("OPENAI_API_KEY");
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
export const geminiEmbed = genAI.getGenerativeModel({
  model: "text-embedding-004"
});
