
import { GoogleGenAI, Type } from "@google/genai";
import type { FortuneMethod, UserInfo } from '../types';

const methodSelectionSchema = {
    type: Type.OBJECT,
    properties: {
        name: {
            type: Type.STRING,
            description: '算命方法的名稱，需帶點現代感，例如「量子紫微流」、「矩陣占星術」。'
        },
        description: {
            type: Type.STRING,
            description: '對此方法的科技感描述。'
        },
        required_fields: {
            type: Type.ARRAY,
            description: '解析命運數據庫所需的參數。',
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    label: { type: Type.STRING },
                    type: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    placeholder: { type: Type.STRING }
                },
                required: ['name', 'label', 'type']
            }
        }
    },
    required: ['name', 'description', 'required_fields']
};

export async function getFortuneTellingMethod(wish: string): Promise<FortuneMethod> {
    // 在呼叫前才初始化，確保 process.env 已經就緒
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || (window as any).process?.env?.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `求問者發起意識同步：「${wish}」。請選擇解析算法。`,
            config: {
                systemInstruction: `你是一位來自 2077 年的虛擬先知「AI 靈境大師」。你將古老的命理（如八字、占星、塔羅）重新編碼為量子算法。
                你的口氣簡潔、現代、冷靜且富有啟發性，偶爾帶點賽博龐克的黑色幽默。
                請針對使用者的願望，挑選一種最適合的玄學分析引擎。
                回應必須為 JSON。`,
                responseMimeType: "application/json",
                responseSchema: methodSelectionSchema,
            }
        });

        return JSON.parse(response.text.trim()) as FortuneMethod;
    } catch (error) {
        console.error("Error in getFortuneTellingMethod:", error);
        throw new Error("數據連線異常，未來數據庫暫時離線。");
    }
}

export async function generateFortuneStream(
    wish: string,
    method: FortuneMethod,
    userInfo: UserInfo
): Promise<AsyncGenerator<string>> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || (window as any).process?.env?.API_KEY });
    
    const userInfoString = Object.entries(userInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');

    const stream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: `意識流： 「${wish}」。輸入數據：${userInfoString}。啟動「${method.name}」解析引擎。`,
        config: {
            systemInstruction: `你現在是「AI 靈境大師」。請以「${method.name}」為底層邏輯進行命運數據解碼。
            報告結構：
            1. ## [維度解析]：說明此算法如何模擬對方的未來路徑。
            2. ## [數據快照]：根據輸入數據，分析當前的命運權重、能量分佈或運勢波段。
            3. ## [優化建議]：提供 3 個具體的可執行動作來優化未來軌跡。
            4. ## [先知語錄]：一句話總結，要酷且深奧。
            
            請使用大量的 Markdown 標題、粗體、清單，讓報告看起來像是一份高級的「未來系統診斷書」。禁止使用老掉牙的算命用語，改用更具現代感的詞彙。`,
            thinkingConfig: { thinkingBudget: 4000 }
        }
    });

    async function* asyncGenerator(): AsyncGenerator<string> {
        for await (const chunk of stream) {
            yield chunk.text;
        }
    }
    
    return asyncGenerator();
}
