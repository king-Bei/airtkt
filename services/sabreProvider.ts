
import { SearchParams, Flight, FlightSegment } from '../types';
import { db } from './db';

const OFFICIAL_BASE_URL = 'https://api.test.sabre.com';

export const sabreProvider = {
  generateRequestId: () => `SABRE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,

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
      console.error("[Sabre Auth Network Error] Check your CORS or Bridge URL settings.", e);
      return null;
    }
  },

  search: async (params: SearchParams): Promise<Flight[]> => {
    const token = await sabreProvider.getToken();
    if (!token) return [];

    const baseUrl = sabreProvider.getBaseUrl();
    // BFM Request Structure
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
        console.error("[Sabre Search Error] Status:", response.status);
        return [];
      }

      const data = await response.json();
      const groupedItineraryResponse = data.groupedItineraryResponse;

      if (!groupedItineraryResponse) return [];

      const scheduleDescs = groupedItineraryResponse.scheduleDescs; // Map of schedules
      const legDescs = groupedItineraryResponse.legDescs; // Map of legs
      const itineraryGroups = groupedItineraryResponse.itineraryGroups;

      if (!itineraryGroups || itineraryGroups.length === 0) return [];

      const flights: Flight[] = [];

      // Iterate through groups (usually grouped by brand/leg)
      itineraryGroups.forEach((group: any) => {
        const itineraries = group.itineraries;
        if (!itineraries) return;

        itineraries.forEach((itinerary: any) => {
          // Pricing Information
          const totalFare = itinerary.pricingSourceAdjustment?.[0]?.totalFare || group.groupDescription?.legend?.totalFare;
          // If we can't find price, skip
          if (!itinerary.totalFare && !totalFare) return;

          const price = itinerary.totalFare?.TotalPrice || totalFare?.TotalPrice;
          if (!price) return;

          // Helper to build segments
          const segments: FlightSegment[] = [];
          const legs = itinerary.legs; // Array of leg references

          legs.forEach((legRef: any) => {
            const legDesc = legDescs.find((l: any) => l.id === legRef.ref);
            if (!legDesc) return;

            legDesc.schedules.forEach((scheduleRef: any) => {
              const schedule = scheduleDescs.find((s: any) => s.id === scheduleRef.ref);
              if (!schedule) return;

              segments.push({
                airline: schedule.carrier.marketing, // Code
                airlineCode: schedule.carrier.marketing,
                flightNumber: `${schedule.carrier.marketing}${schedule.carrier.marketingFlightNumber}`,
                departureAirport: schedule.departure.airport,
                departureAirportName: schedule.departure.airport,
                departureTerminal: schedule.departure.terminal,
                arrivalAirport: schedule.arrival.airport,
                arrivalAirportName: schedule.arrival.airport,
                arrivalTerminal: schedule.arrival.terminal,
                departureTime: schedule.departure.time, // Format usually: 2023-10-25T10:00:00
                arrivalTime: schedule.arrival.time,
                duration: (schedule.elapsedTime || 0).toString()
              });
            });
          });

          flights.push({
            id: `SAB-${itinerary.id}`,
            provider: 'Sabre',
            basePrice: price, // Simplified, usually need to parse EquivFare
            totalPrice: price,
            currency: 'TWD', // Assuming TWD or parsing it from "TWD12345"
            class: params.class,
            baggageAllowance: '23KG', // Default fallback, BFM Baggage is complex
            availableSeats: 9, // BFM usually implies available if returned
            segments
          });
        });
      });

      return flights;
    } catch (e) {
      console.error("[Sabre Search Network Error]", e);
      return [];
    }
  }
};
