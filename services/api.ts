
import { Flight, SearchParams } from '../types';
import { flightService } from './flightService';

export const flightApi = {
  search: async (params: SearchParams): Promise<Flight[]> => {
    // 直接呼叫以 GDS 為核心的搜尋服務
    const results = await flightService.searchFlights(params);
    
    if (results.length === 0) {
      // 實測階段不提供模擬備援，以便觀察真實 API 錯誤
      return []; 
    }
    
    return results;
  }
};
