
import { GoogleGenAI, Type } from "@google/genai";

export const getFinancialInsight = async (
  from: string,
  middle: string,
  to: string,
  spread: number,
  efficiency: number
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  const prompt = `
    Analyze the currency conversion route: ${from} -> ${middle} -> ${to}.
    The calculated "spread" (loss due to intermediate conversion) is ${spread.toFixed(4)}%.
    The efficiency relative to direct conversion is ${efficiency.toFixed(2)}%.
    
    Provide a brief, expert financial commentary in Russian about this specific route.
    Mention why this conversion might be common or why it might be inefficient.
    Keep it under 3 sentences.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Не удалось получить аналитическое заключение от ИИ.";
  }
};
