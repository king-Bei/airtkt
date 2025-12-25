
import { SearchParams, Flight, FlightSegment } from '../types';
import { db } from './db';

const OFFICIAL_BASE_URL = 'https://api.test.sabre.com';

export const sabreProvider = {
  generateRequestId: () => `SABRE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,

  getBaseUrl: () => {
    // FORCE CORRECT URL FOR DEBUGGING
    // Jetty default context is '/' unless configured otherwise
    return 'http://localhost:8080/api';
  },

  getToken: async () => {
    // When using the Java Bridge, authentication is handled server-side.
    // We don't need to fetch a token from the client.
    // Returning a dummy token allows the flow to proceed to the search step.
    return "BRIDGE_HANDLES_AUTH";
  },

  search: async (params: SearchParams): Promise<Flight[]> => {
    // ---------------------------------------------------------
    // MOCK MODE: Bypass network if connection is known to fail
    // ---------------------------------------------------------
    if (sabreProvider.MOCK_MODE) {
      console.warn("[Sabre] Using Mock Data for Search");
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1000));
      return [
        {
          id: 'MOCK-SABRE-1',
          provider: 'Sabre',
          basePrice: 12000,
          totalPrice: 12500,
          currency: 'TWD',
          class: params.class,
          baggageAllowance: '23KG',
          availableSeats: 9,
          segments: [
            {
              airline: 'BR',
              airlineCode: 'BR',
              flightNumber: 'BR123',
              departureAirport: params.origin,
              departureAirportName: params.origin,
              arrivalAirport: params.destination,
              arrivalAirportName: params.destination,
              departureTime: `${params.date}T10:00:00`,
              arrivalTime: `${params.date}T14:00:00`,
              duration: '240'
            }
          ]
        },
        {
          id: 'MOCK-SABRE-2',
          provider: 'Sabre',
          basePrice: 15000,
          totalPrice: 15500,
          currency: 'TWD',
          class: params.class,
          baggageAllowance: '30KG',
          availableSeats: 5,
          segments: [
            {
              airline: 'CI',
              airlineCode: 'CI',
              flightNumber: 'CI456',
              departureAirport: params.origin,
              departureAirportName: params.origin,
              arrivalAirport: params.destination,
              arrivalAirportName: params.destination,
              departureTime: `${params.date}T15:00:00`,
              arrivalTime: `${params.date}T19:00:00`,
              duration: '240'
            }
          ]
        }
      ];
    }
    // ---------------------------------------------------------

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
        console.error("[Sabre Search Error] Status:", response.status);
        return [];
      }

      const data = await response.json();
      const groupedItineraryResponse = data.groupedItineraryResponse;
      if (!groupedItineraryResponse) return [];

      const scheduleDescs = groupedItineraryResponse.scheduleDescs;
      const legDescs = groupedItineraryResponse.legDescs;
      const itineraryGroups = groupedItineraryResponse.itineraryGroups;

      if (!itineraryGroups || itineraryGroups.length === 0) return [];
      const flights: Flight[] = [];

      itineraryGroups.forEach((group: any) => {
        const itineraries = group.itineraries;
        if (!itineraries) return;

        itineraries.forEach((itinerary: any) => {
          const totalFare = itinerary.pricingSourceAdjustment?.[0]?.totalFare || group.groupDescription?.legend?.totalFare;
          if (!itinerary.totalFare && !totalFare) return;
          const price = itinerary.totalFare?.TotalPrice || totalFare?.TotalPrice;
          if (!price) return;

          const segments: FlightSegment[] = [];
          const legs = itinerary.legs;

          legs.forEach((legRef: any) => {
            const legDesc = legDescs.find((l: any) => l.id === legRef.ref);
            if (!legDesc) return;
            legDesc.schedules.forEach((scheduleRef: any) => {
              const schedule = scheduleDescs.find((s: any) => s.id === scheduleRef.ref);
              if (!schedule) return;
              segments.push({
                airline: schedule.carrier.marketing,
                airlineCode: schedule.carrier.marketing,
                flightNumber: `${schedule.carrier.marketing}${schedule.carrier.marketingFlightNumber}`,
                departureAirport: schedule.departure.airport,
                departureAirportName: schedule.departure.airport,
                departureTerminal: schedule.departure.terminal,
                arrivalAirport: schedule.arrival.airport,
                arrivalAirportName: schedule.arrival.airport,
                arrivalTerminal: schedule.arrival.terminal,
                departureTime: schedule.departure.time,
                arrivalTime: schedule.arrival.time,
                duration: (schedule.elapsedTime || 0).toString()
              });
            });
          });

          flights.push({
            id: `SAB-${itinerary.id}`,
            provider: 'Sabre',
            basePrice: price,
            totalPrice: price,
            currency: 'TWD',
            class: params.class,
            baggageAllowance: '23KG',
            availableSeats: 9,
            segments
          });
        });
      });
      return flights;
    } catch (e) {
      console.error("[Sabre Search Network Error]", e);
      return [];
    }
  },

  // ----------------------------------------------------
  // Step 2: Revalidate
  // ----------------------------------------------------
  revalidateFlight: async (flightId: string): Promise<boolean> => {
    if (sabreProvider.MOCK_MODE) {
      console.log("[Sabre Mock] Revalidating flight", flightId);
      await new Promise(r => setTimeout(r, 800));
      return true; // Always success in mock
    }

    // In real implementation you would pass the specific itinerary details
    // captured from the search response.
    // POST /v4/shop/flights/revalidate
    try {
      const baseUrl = sabreProvider.getBaseUrl();
      // This is a placeholder payload. Real revalidation requires passing back
      // the sequence of flights and fare basis codes.
      const payload = {
        OTA_AirLowFareSearchRQ: {
          // ... full revalidate payload construction
        }
      };
      // Just checking if we can hit the endpoint structure
      /*
      const response = await fetch(`${baseUrl}/v4/shop/flights/revalidate`, { ... });
      return response.ok;
      */
      return true;
    } catch (e) {
      console.error("Revalidate failed", e);
      return false;
    }
  },

  // ----------------------------------------------------
  // Step 5: Create Booking
  // ----------------------------------------------------
  createBooking: async (bookingRequest: any): Promise<string | null> => {
    if (sabreProvider.MOCK_MODE) {
      console.log("[Sabre Mock] Creating booking", bookingRequest);
      await new Promise(r => setTimeout(r, 1500));
      return "MOCK-PNR-" + Math.floor(Math.random() * 100000);
    }

    const token = await sabreProvider.getToken();
    const baseUrl = sabreProvider.getBaseUrl();
    // endpoint for Booking Management API (Create Booking)
    // Usually /v1/trip/orders/createBooking or similar in older SOAP-to-REST bridges

    // Note: The bridge must whitelist this URL.
    // For now we assume a standard structure.

    try {
      // Placeholder for Create Booking Payload
      const payload = {
        CreatePassengerNameRecordRQ: {
          // ... complex PNR creation payload
        }
      };

      const response = await fetch(`${baseUrl}/v1.2.0/passenger/records`, { /* ... */ });
      if (response.ok) {
        const data = await response.json();
        return data.itineraryRef.ID; // PNR
      }
      return null;
    } catch (e) {
      console.error("Booking failed", e);
      return null;
    }
  },

  // Toggle for debugging when network is down
  MOCK_MODE: true
};
