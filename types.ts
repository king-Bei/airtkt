
export enum FlightClass {
  ECONOMY = 'Economy',
  PREMIUM_ECONOMY = 'Premium Economy',
  BUSINESS = 'Business',
  FIRST = 'First'
}

export type TripType = 'one-way' | 'round-trip';

export interface FlightSegment {
  airline: string;
  airlineCode: string;
  airlineLogo?: string;
  flightNumber: string;
  departureAirport: string;
  departureAirportName: string;
  departureTerminal?: string;
  arrivalAirport: string;
  arrivalAirportName: string;
  arrivalTerminal?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
}

export interface Flight {
  id: string;
  provider: 'Amadeus' | 'Sabre' | 'System' | 'Gemini-Search';
  segments: FlightSegment[];
  basePrice: number;
  totalPrice: number;
  currency: string;
  class: FlightClass;
  baggageAllowance: string;
  availableSeats?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'admin';
}

export interface PricingRule {
  id: string;
  airlineCode: string;
  flightClass: FlightClass;
  markupAmount: number;
  markupType: 'percent' | 'fixed';
  provider?: string;
}

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  passport: string;
  birthDate: string;
  gender: 'M' | 'F';
  ticketNumber?: string;
  email?: string;
  phone?: string;
}

export interface Booking {
  id: string;
  userId: string;
  flight: Flight;
  returnFlight?: Flight;
  passengers: Passenger[];
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Refunded';
  bookingDate: string;
  totalAmount: number;
  pnr: string;
  paymentStatus: 'Unpaid' | 'Paid';
}

export interface SearchParams {
  tripType: TripType;
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  class: FlightClass;
}

export interface ApiCredentials {
  amadeusClientId?: string;
  amadeusClientSecret?: string;
  sabreClientId?: string;
  sabreClientSecret?: string;
  sabreAccessToken?: string;
  sabreBridgeUrl?: string; // 新增：用於解決 CORS 的 Bridge URL
}
