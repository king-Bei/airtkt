
import { SearchParams, Flight, FlightClass } from '../types';
import { db } from './db';

const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';
const SABRE_BASE_URL = 'https://api.test.sabre.com';

export const externalProviders = {
  // --- Amadeus OAuth2 認證 ---
  getAmadeusToken: async () => {
    const creds = db.getCredentials();
    if (!creds.amadeusClientId || !creds.amadeusClientSecret) return null;
    
    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    body.append('client_id', creds.amadeusClientId);
    body.append('client_secret', creds.amadeusClientSecret);

    try {
      const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.access_token;
    } catch (e) {
      console.error("Amadeus Auth Error:", e);
      return null;
    }
  },

  // --- Amadeus Flight Offers Search (v2) ---
  searchAmadeus: async (params: SearchParams): Promise<Flight[]> => {
    const token = await externalProviders.getAmadeusToken();
    if (!token) return [];

    const url = new URL(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`);
    url.searchParams.append('originLocationCode', params.origin.toUpperCase());
    url.searchParams.append('destinationLocationCode', params.destination.toUpperCase());
    url.searchParams.append('departureDate', params.date);
    if (params.tripType === 'round-trip' && params.returnDate) {
      url.searchParams.append('returnDate', params.returnDate);
    }
    url.searchParams.append('adults', params.adults.toString());
    url.searchParams.append('children', params.children.toString());
    url.searchParams.append('currencyCode', 'TWD');
    url.searchParams.append('max', '20');

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Amadeus API Result Error:", err);
        return [];
      }

      const data = await response.json();
      const carriers = data.dictionaries?.carriers || {};

      return (data.data || []).map((offer: any) => {
        const itinerary = offer.itineraries[0]; // 去程
        const segments = itinerary.segments.map((s: any) => ({
          airline: carriers[s.carrierCode] || s.carrierCode,
          airlineCode: s.carrierCode,
          flightNumber: `${s.carrierCode}${s.number}`,
          departureAirport: s.departure.iataCode,
          departureAirportName: s.departure.iataCode,
          departureTerminal: s.departure.terminal,
          arrivalAirport: s.arrival.iataCode,
          arrivalAirportName: s.arrival.iataCode,
          arrivalTerminal: s.arrival.terminal,
          departureTime: s.departure.at,
          arrivalTime: s.arrival.at,
          duration: s.duration.replace('PT', '').toLowerCase()
        }));

        return {
          id: `AMA-${offer.id}`,
          provider: 'Amadeus',
          basePrice: parseFloat(offer.price.base),
          totalPrice: parseFloat(offer.price.grandTotal || offer.price.total),
          currency: 'TWD',
          class: params.class,
          baggageAllowance: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.includedCheckedBags?.quantity ? 
                            `${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity}PC` : '需另購',
          availableSeats: offer.numberOfBookableSeats,
          segments
        };
      });
    } catch (e) {
      console.error("Amadeus Fetch Error:", e);
      return [];
    }
  },

  // --- Sabre Bargain Finder Max (v4) ---
  searchSabre: async (params: SearchParams): Promise<Flight[]> => {
    const creds = db.getCredentials();
    if (!creds.sabreAccessToken) return [];

    const url = `${SABRE_BASE_URL}/v4/shop/flights?reshop=false`;
    
    const body = {
      OTA_AirLowFareSearchRQ: {
        OriginDestinationInformation: [
          {
            DepartureDateTime: `${params.date}T00:00:00`,
            DestinationLocation: { LocationCode: params.destination.toUpperCase() },
            OriginLocation: { LocationCode: params.origin.toUpperCase() },
            RPH: "1"
          }
        ],
        PassengerTypeQuantity: [
          { Code: "ADT", Quantity: params.adults }
        ],
        TPA_Extensions: {
          IntelliSellTransaction: { ServiceTag: "BFM" }
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.sabreAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) return [];
      const data = await response.json();
      
      // Sabre 的解析邏輯通常涉及多層嵌套 (PricedItineraries)
      // 這裡提供基礎框架，實測時可根據 Console 顯示的 data 結構進行對應
      console.log("Sabre Live Response:", data);
      
      return []; // 目前 Sabre 部分需視您的 PCC/授權範圍動態調整
    } catch (e) {
      console.error("Sabre Fetch Error:", e);
      return [];
    }
  }
};
