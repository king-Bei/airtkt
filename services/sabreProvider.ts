
import { SearchParams, Flight } from '../types';
import { db } from './db';

const OFFICIAL_BASE_URL = 'https://api.test.sabre.com';

export const sabreProvider = {
  generateRequestId: () => `SABRE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,

  // 取得基礎 URL，優先使用使用者配置的 Bridge (解決 CORS 問題)
  getBaseUrl: () => {
    const creds = db.getCredentials();
    return creds.sabreBridgeUrl || OFFICIAL_BASE_URL;
  },

  getToken: async () => {
    const creds = db.getCredentials();
    if (creds.sabreAccessToken) return creds.sabreAccessToken;
    if (!creds.sabreClientId || !creds.sabreClientSecret) return null;

    const baseUrl = sabreProvider.getBaseUrl();
    const encoded = btoa(`${creds.sabreClientId}:${creds.sabreClientSecret}`);
    
    try {
      // 如果使用 Bridge，API 路徑可能有所不同，這裡保持標準 REST 路徑
      const response = await fetch(`${baseUrl}/v1/auth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encoded}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Request-ID': sabreProvider.generateRequestId()
        },
        body: 'grant_type=client_credentials'
      });
      
      if (!response.ok) {
        const err = await response.text();
        console.error("[Sabre Auth Error]", response.status, err);
        return null;
      }
      const data = await response.json();
      return data.access_token;
    } catch (e) {
      console.error("[Sabre Auth Network Error] 這通常是因為瀏覽器 CORS 限制。請在後台配置 Sabre Bridge URL (如您的 Java Bridge 地址)。", e);
      return null;
    }
  },

  search: async (params: SearchParams): Promise<Flight[]> => {
    const token = await sabreProvider.getToken();
    if (!token) return [];

    const baseUrl = sabreProvider.getBaseUrl();
    const payload = {
      OTA_AirLowFareSearchRQ: {
        Version: "4.3.0",
        OriginDestinationInformation: [
          {
            DepartureDateTime: `${params.date}T00:00:00`,
            OriginLocation: { LocationCode: params.origin.toUpperCase() },
            DestinationLocation: { LocationCode: params.destination.toUpperCase() },
            RPH: "1"
          }
        ],
        PassengerTypeQuantity: [{ Code: "ADT", Quantity: params.adults }],
        TPA_Extensions: {
          IntelliSellTransaction: { ServiceTag: "BFM" }
        }
      }
    };

    try {
      const response = await fetch(`${baseUrl}/v4/shop/flights?reshop=false`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Request-ID': sabreProvider.generateRequestId()
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error("[Sabre Search Error]", response.status);
        return [];
      }
      
      const data = await response.json();
      
      // 解析邏輯 (略，根據實務返回資料 Mapping)
      if (!data.groupedItineraryResponse) return [];
      
      // 這裡僅作示意：從 Bridge 獲取的資料解析
      return []; 
    } catch (e) {
      console.error("[Sabre Search Network Error]", e);
      return [];
    }
  }
};
