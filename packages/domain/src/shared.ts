export type UUID = string;
export type ISODateTime = string;
export type CurrencyCode = string;

export interface PagingInput {
  limit?: number;
  cursor?: string;
}

export interface PagingResult<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

export interface Money {
  amountMinor: string;
  currency: CurrencyCode;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}
