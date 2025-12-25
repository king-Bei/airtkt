
import { GoogleGenAI, Type } from "@google/genai";
import { Flight, SearchParams, FlightClass, TripType } from "../types";
import { db } from "./db";
import { externalProviders } from "./externalApis";

const MOCK_AIRLINES = [
  { code: 'BR', name: '長榮航空' },
  { code: 'CI', name: '中華航空' },
  { code: 'CX', name: '國泰航空' },
  { code: 'JL', name: '日本航空' },
  { code: 'NH', name: '全日空' },
  { code: 'TG', name: '泰國航空' },
  { code: 'SQ', name: '新加坡航空' }
];

export const flightService = {
  // 快速生成本地模擬資料，解決搜尋太慢的問題
  generateQuickResults: (params: SearchParams, isReturn: boolean = false): Flight[] => {
    const origin = isReturn ? params.destination : params.origin;
    const destination = isReturn ? params.origin : params.destination;
    const date = isReturn ? params.returnDate : params.date;
    const pricingRules = db.getPricingRules();
    
    return Array.from({ length: 4 }).map((_, i) => {
      const airline = MOCK_AIRLINES[Math.floor(Math.random() * MOCK_AIRLINES.length)];
      const basePrice = 8000 + Math.floor(Math.random() * 25000);
      const rule = pricingRules[0];
      // Use markupAmount for percentage logic if markupType is percent
      const markupPercent = rule.markupType === 'percent' ? rule.markupAmount : 0;
      const markup = 1 + (markupPercent / 100);
      
      const hour = 7 + (i * 3);
      const depTime = `${date}T${hour.toString().padStart(2, '0')}:30:00`;
      const arrTime = `${date}T${(hour + 3).toString().padStart(2, '0')}:45:00`;

      return {
        id: `QUICK-${Math.random().toString(36).substring(7)}`,
        provider: 'Gemini-Search',
        basePrice,
        totalPrice: Math.round(basePrice * markup),
        currency: 'TWD',
        availableSeats: 9,
        class: params.class,
        baggageAllowance: '23KG',
        segments: [{
          airline: airline.name,
          airlineCode: airline.code,
          airlineLogo: airline.code,
          flightNumber: `${airline.code}${Math.floor(100 + Math.random() * 800)}`,
          departureAirport: origin.toUpperCase(),
          departureAirportName: `${origin.toUpperCase()} 國際機場`,
          arrivalAirport: destination.toUpperCase(),
          arrivalAirportName: `${destination.toUpperCase()} 國際機場`,
          departureTime: depTime,
          arrivalTime: arrTime,
          duration: "3小時 15分"
        }]
      };
    });
  },

  // 解析自然語言或圖片
  parseNaturalLanguageInput: async (text: string, imageBase64?: string): Promise<Partial<SearchParams>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const prompt = `你是一個專業的旅遊票務助手。請從提供的內容中提取：tripType, origin, destination, date, returnDate, adults, class。
    現在日期是 ${new Date().toISOString().split('T')[0]}。
    城市請轉換為 3 碼 IATA。回傳純 JSON。`;

    const parts: any[] = [{ text: prompt }];
    if (text) parts.push({ text: `使用者輸入：${text}` });
    if (imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: { responseMimeType: "application/json" }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
  },

  searchFlights: async (params: SearchParams, isReturn: boolean = false): Promise<Flight[]> => {
    db.logSearch(params);
    const creds = db.getCredentials();
    const pricingRules = db.getPricingRules();

    let allFlights: Flight[] = [];
    
    // 1. 嘗試從 Amadeus 獲取真實資料
    if (!isReturn && creds.amadeusClientId) {
      try {
        const amadeusFlights = await externalProviders.searchAmadeus(params);
        allFlights = [...allFlights, ...amadeusFlights];
      } catch (e) { console.error("Amadeus error"); }
    }

    // 2. 如果真實資料不足，則啟動 AI 深度搜尋 (這部分較慢，所以我們會先回傳 QuickResults)
    if (allFlights.length < 2) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `搜尋真實航班：${params.origin} 到 ${params.destination}, 日期 ${isReturn ? params.returnDate : params.date}。回傳 JSON 陣列。`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                provider: { type: Type.STRING },
                basePrice: { type: Type.NUMBER },
                segments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { airline: { type: Type.STRING }, flightNumber: { type: Type.STRING }, departureAirport: { type: Type.STRING }, arrivalAirport: { type: Type.STRING }, departureTime: { type: Type.STRING }, arrivalTime: { type: Type.STRING }, duration: { type: Type.STRING } } } }
              }
            }
          }
        }
      });

      try {
        let aiFlights: any[] = JSON.parse(response.text || "[]");
        // Ensure flights from AI match the provider type and segments structure
        const mappedAiFlights: Flight[] = aiFlights.map(f => ({
          ...f,
          provider: 'Gemini-Search',
          class: params.class,
          currency: 'TWD',
          baggageAllowance: '23KG',
          totalPrice: f.basePrice, // Will be updated below
          segments: (f.segments || []).map((s: any) => ({
            ...s,
            airlineCode: s.airline?.substring(0, 2).toUpperCase() || 'AI',
            departureAirportName: s.departureAirport,
            arrivalAirportName: s.arrivalAirport
          }))
        }));
        allFlights = [...allFlights, ...mappedAiFlights];
      } catch (e) { console.error("AI error"); }
    }

    return allFlights.map(flight => {
      // Find matching pricing rule
      const rule = pricingRules.find(r => r.provider === flight.provider) || pricingRules[0];
      // Fix: Corrected property access from markupPercentage to markupAmount and applied correct logic
      if (rule.markupType === 'percent') {
        return { ...flight, totalPrice: Math.round(flight.basePrice * (1 + rule.markupAmount / 100)) };
      } else {
        return { ...flight, totalPrice: flight.basePrice + rule.markupAmount };
      }
    });
  }
};
