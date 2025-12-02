
import { GoogleGenAI } from "@google/genai";
import { Hospital, Contact, Note, UsageRecord, Product } from '../types';

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateHospitalInsight = async (
  hospital: Hospital,
  contacts: Contact[],
  notes: Note[],
  usage: UsageRecord[],
  products: Product[]
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI 服務無法使用 (缺少 API Key)";

  const prompt = `
    你是一位專業的醫療銷售助理。請根據以下醫院客戶的數據，為業務代表提供一份簡潔且具體的摘要。
    請用繁體中文（台灣用語）回答。
    重點包含：
    1. 目前的關係階段與健康狀況。
    2. 設備使用趨勢 (MR810) 和耗材需求 (AA 系列)。
    3. 建議的下一步行動，以推進銷售或改善關係。

    數據：
    醫院: ${JSON.stringify(hospital)}
    聯絡人: ${JSON.stringify(contacts)}
    最近筆記: ${JSON.stringify(notes)}
    使用記錄: ${JSON.stringify(usage)}
    產品目錄: ${JSON.stringify(products)}

    語氣請保持專業且具策略性。字數限制在 200 字以內。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "無法生成摘要。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成見解時發生錯誤。";
  }
};

export const generateEmailDraft = async (
  contactName: string,
  hospitalName: string,
  context: string,
  tone: 'Professional' | 'Friendly' | 'Urgent'
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI 服務無法使用";

  const prompt = `
    請為我草擬一封給 ${hospitalName} 的 ${contactName} 的電子郵件。
    請用繁體中文（台灣用語）。
    背景: ${context}
    語氣: ${tone === 'Professional' ? '專業' : tone === 'Friendly' ? '友善' : '緊急'}
    
    郵件內容應可直接複製貼上。請包含主旨。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "無法生成草稿。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成草稿時發生錯誤。";
  }
};

export const refineNoteContent = async (content: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return content;

  const prompt = `
    你是一位專業的業務助理。
    請將以下粗略的筆記潤飾為清晰、專業的 CRM 活動記錄。
    請用繁體中文（台灣用語）。
    修正語法，提高清晰度，並確保語氣專業。
    保持簡潔。不要捏造事實。
    
    原始筆記: "${content}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || content;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return content;
  }
};
