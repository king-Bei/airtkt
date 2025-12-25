
import { User, PricingRule, Booking, SearchParams, ApiCredentials, FlightClass, Passenger } from '../types';

const STORAGE_KEYS = {
  USERS: 'skybound_users',
  PRICING: 'skybound_pricing',
  BOOKINGS: 'skybound_bookings',
  LOGS: 'skybound_search_logs',
  CREDS: 'skybound_api_creds'
};

export const db = {
  // --- User Management ---
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [
      { id: 'u1', name: '王小明', email: 'user@example.com', role: 'member' },
      { id: 'admin', name: '管理員', email: 'admin@skybound.pro', role: 'admin' }
    ];
  },

  // --- Pricing Rules ---
  getPricingRules: (): PricingRule[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRICING);
    if (!data) {
      const defaultRules: PricingRule[] = [
        { id: 'default', airlineCode: 'DEFAULT', flightClass: FlightClass.ECONOMY, markupAmount: 500, markupType: 'fixed' },
        { id: 'br_biz', airlineCode: 'BR', flightClass: FlightClass.BUSINESS, markupAmount: 10, markupType: 'percent' }
      ];
      localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(defaultRules));
      return defaultRules;
    }
    return JSON.parse(data);
  },

  updatePricingRule: (rule: PricingRule) => {
    const rules = db.getPricingRules();
    const idx = rules.findIndex(r => r.id === rule.id);
    if (idx > -1) rules[idx] = rule;
    else rules.push(rule);
    localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(rules));
  },

  deletePricingRule: (id: string) => {
    const rules = db.getPricingRules();
    localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(rules.filter(r => r.id !== id)));
  },

  // --- Booking (模擬 SQL Orders & OrderItems) ---
  getBookings: (): Booking[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  },

  saveBooking: (booking: Booking) => {
    const bookings = db.getBookings();
    bookings.unshift(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  updateBooking: (updatedBooking: Booking) => {
    const bookings = db.getBookings();
    const idx = bookings.findIndex(b => b.id === updatedBooking.id);
    if (idx > -1) {
      bookings[idx] = updatedBooking;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    }
  },

  issueTickets: (bookingId: string) => {
    const bookings = db.getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx > -1) {
      const b = bookings[idx];
      b.status = 'Confirmed';
      b.paymentStatus = 'Paid';
      // 為所有旅客生成票號
      b.passengers = b.passengers.map((p, i) => ({
        ...p,
        ticketNumber: `297-${Math.floor(Math.random() * 9000000000 + 1000000000)}`
      }));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return bookings[idx];
    }
    return null;
  },

  getCredentials: (): ApiCredentials => {
    const data = localStorage.getItem(STORAGE_KEYS.CREDS);
    return data ? JSON.parse(data) : {
      amadeusClientId: import.meta.env.VITE_AMADEUS_CLIENT_ID || '',
      amadeusClientSecret: import.meta.env.VITE_AMADEUS_CLIENT_SECRET || '',
      sabreClientId: import.meta.env.VITE_SABRE_CLIENT_ID || '',
      sabreClientSecret: import.meta.env.VITE_SABRE_CLIENT_SECRET || '',
      sabreBridgeUrl: import.meta.env.VITE_SABRE_BRIDGE_URL || 'http://localhost:8080/sabreapibridge'
    };
  },

  saveCredentials: (creds: ApiCredentials) => {
    localStorage.setItem(STORAGE_KEYS.CREDS, JSON.stringify(creds));
  },

  logSearch: (params: SearchParams) => {
    const logs = db.getSearchLogs();
    logs.unshift({ ...params, timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 100)));
  },

  getSearchLogs: (): any[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  }
};
