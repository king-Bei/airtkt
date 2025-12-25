
import { Flight, SearchParams } from "../types";
import { db } from "./db";
import { amadeusProvider } from "./amadeusProvider";
import { sabreProvider } from "./sabreProvider";
import { calculateFinalPrice } from "./pricingEngine";

export const flightService = {
  generateQuickResults: (params: SearchParams, isReturn: boolean = false): Flight[] => {
    return []; 
  },

  searchFlights: async (params: SearchParams, isReturn: boolean = false): Promise<Flight[]> => {
    db.logSearch(params);
    
    // 同步啟動兩邊的搜尋，互不阻塞
    const [amadeusRaw, sabreRaw] = await Promise.all([
      amadeusProvider.search(params).catch(() => []),
      sabreProvider.search(params).catch(() => [])
    ]);

    const combined = [...amadeusRaw, ...sabreRaw];

    if (combined.length === 0) {
      console.warn("GDS 資料獲取失敗：請檢查後台 API 配置是否正確。");
    }

    // 應用定價引擎：現在會傳入 Provider 以執行「分開的規則」
    return combined.map(flight => {
      const finalPrice = calculateFinalPrice(
        flight.segments[0]?.airlineCode || 'XX',
        flight.class,
        flight.basePrice,
        flight.provider // 將供應商資訊傳入
      );
      
      return { 
        ...flight, 
        totalPrice: finalPrice 
      };
    });
  }
};
