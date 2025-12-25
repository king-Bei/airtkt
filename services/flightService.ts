
import { Flight, SearchParams } from "../types";
import { db } from "./db";
import { amadeusProvider } from "./amadeusProvider";
import { sabreProvider } from "./sabreProvider";
import { calculateFinalPrice } from "./pricingEngine";

export const flightService = {
  createBooking: async (flight: Flight, passengers: any[], returnFlight?: Flight): Promise<string | null> => {
    // 依據 Provider 決定使用哪家 GDS 進行訂位
    if (flight.provider === 'Sabre') {
      // Step 2: Revalidate (Optional but recommended)
      const isValid = await sabreProvider.revalidateFlight(flight.id);
      if (!isValid) throw new Error("航班價格已變動或機位已滿");

      // Step 5: Create Booking
      // 在此處需組裝符合 Sabre 規格的 Passenger 資訊
      // 簡化示範：只傳一個 dummy object
      const pnr = await sabreProvider.createBooking({
        flightId: flight.id,
        passengers
      });
      return pnr;
    }

    // Amadeus implementation placeholder...
    return "MOCK-PNR-" + Math.floor(Math.random() * 100000);
  },

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
