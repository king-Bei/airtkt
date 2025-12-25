
import { SearchParams, Flight } from '../types';
import { db } from './db';

const BASE_URL = 'https://test.api.amadeus.com';

export const amadeusProvider = {
  getToken: async () => {
    const creds = db.getCredentials();
    if (!creds.amadeusClientId || !creds.amadeusClientSecret) return null;

    // Check if we have a cached valid token (implied TODO: add real caching)

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
      if (!response.ok) {
        console.error(`[Amadeus Auth] Failed: ${response.status} ${response.statusText}`);
        return null;
      }
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
      console.warn("Amadeus Provider: No valid credentials or token. Skipping.");
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
    url.searchParams.append('children', (params.children || 0).toString());
    url.searchParams.append('currencyCode', 'TWD');
    url.searchParams.append('max', '20');

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Amadeus Search] API Error: ${response.status}`, errText);
        return [];
      }
      const data = await response.json();
      const carriers = data.dictionaries?.carriers || {};
      const aircraft = data.dictionaries?.aircraft || {};

      return (data.data || []).map((offer: any) => {
        // First itinerary is usually the outbound logic
        const itinerary = offer.itineraries[0];

        return {
          id: `AMA-${offer.id}`,
          provider: 'Amadeus',
          basePrice: parseFloat(offer.price.base),
          totalPrice: parseFloat(offer.price.grandTotal || offer.price.total),
          currency: 'TWD', // Forced TWD as per request param, though API returns it
          class: params.class,
          // Amadeus structure for baggage is nested deep
          baggageAllowance: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity ?
            `${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity}PC` : '23KG',
          availableSeats: offer.numberOfBookableSeats,
          segments: itinerary.segments.map((s: any) => ({
            airline: carriers[s.carrierCode] || s.carrierCode,
            airlineCode: s.carrierCode,
            flightNumber: `${s.carrierCode}${s.number}`,
            departureAirport: s.departure.iataCode,
            departureAirportName: s.departure.iataCode, // Could map to real names if we had a DB
            departureTerminal: s.departure.terminal,
            arrivalAirport: s.arrival.iataCode,
            arrivalAirportName: s.arrival.iataCode,
            arrivalTerminal: s.arrival.terminal,
            departureTime: s.departure.at,
            arrivalTime: s.arrival.at,
            duration: s.duration.replace('PT', '').toLowerCase(),
            aircraft: aircraft[s.aircraft?.code] || s.aircraft?.code
          }))
        };
      });
    } catch (e) {
      console.error("[Amadeus Search Error]", e);
      return [];
    }
  }
};
