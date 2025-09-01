
export interface User {
  name: string;
  contact: string;
  loginKey?: number;
}

export enum FieldType {
  LargeQuarter = 'large-quarter',
  LargeHalf = 'large-half',
  LargeFull = 'large-full',
  Small = 'small',
}

export interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  field_type: FieldType;
  field_index: number;
  user_name: string;
  contact: string;
  price: number;
  status: 'pending' | 'confirmed';
}

export type NewBooking = Omit<Booking, 'id'>;

// Types for dynamic pricing rules
export interface TimeRate {
  offPeak: number;
  peak: number;
  night: number;
}

export interface FieldRates {
  [FieldType.Small]: TimeRate;
  [FieldType.LargeFull]: TimeRate;
  [FieldType.LargeHalf]: TimeRate;
  [FieldType.LargeQuarter]: TimeRate;
}

export interface PricingRules {
  rates: FieldRates;
  blockBookingDiscount: {
    small: number;
    large: number;
  };
}
