
import { SearchParams, Flight } from '../types';
import { db } from './db';

const BASE_URL = 'https://test.api.amadeus.com';

export const amadeusProvider = {
  getToken: async () => {
    const creds = db.getCredentials();
    if (!creds.amadeusClientId || !creds.amadeusClientSecret) return null;
    
    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    body.append('client_id', creds.amadeusClientId);
    body.append('client_secret', creds.amadeusClientSecret);

    try {
      const response = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.access_token;
    } catch (e) {
      console.error("[Amadeus Auth Error]", e);
      return null;
    }
  },

  search: async (params: SearchParams): Promise<Flight[]> => {
    const token = await amadeusProvider.getToken();
    if (!token) {
      console.warn("Amadeus Provider: No valid credentials. Skipping.");
      return [];
    }

    const url = new URL(`${BASE_URL}/v2/shopping/flight-offers`);
    url.searchParams.append('originLocationCode', params.origin.toUpperCase());
    url.searchParams.append('destinationLocationCode', params.destination.toUpperCase());
    url.searchParams.append('departureDate', params.date);
    if (params.tripType === 'round-trip' && params.returnDate) {
      url.searchParams.append('returnDate', params.returnDate);
    }
    url.searchParams.append('adults', params.adults.toString());
    url.searchParams.append('currencyCode', 'TWD');
    url.searchParams.append('max', '15');

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return [];
      const data = await response.json();
      const carriers = data.dictionaries?.carriers || {};

      return (data.data || []).map((offer: any) => ({
        id: `AMA-${offer.id}`,
        provider: 'Amadeus',
        basePrice: parseFloat(offer.price.base),
        totalPrice: parseFloat(offer.price.total),
        currency: 'TWD',
        class: params.class,
        baggageAllowance: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity ? 
                          `${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity}PC` : '23KG',
        segments: offer.itineraries[0].segments.map((s: any) => ({
          airline: carriers[s.carrierCode] || s.carrierCode,
          airlineCode: s.carrierCode,
          flightNumber: `${s.carrierCode}${s.number}`,
          departureAirport: s.departure.iataCode,
          arrivalAirport: s.arrival.iataCode,
          departureTime: s.departure.at,
          arrivalTime: s.arrival.at,
          duration: s.duration.replace('PT', '').toLowerCase()
        }))
      }));
    } catch (e) {
      console.error("[Amadeus Search Error]", e);
      return [];
    }
  }
};
