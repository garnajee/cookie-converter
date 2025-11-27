export interface JsonCookie {
  domain: string;
  expirationDate?: number;
  hostOnly?: boolean;
  httpOnly?: boolean;
  name: string;
  path: string;
  sameSite?: string | null;
  secure?: boolean;
  session?: boolean;
  storeId?: string | null;
  value: string;
  includeSubdomain?: boolean; // Sometimes present in different JSON exports
  [key: string]: any;
}

export interface NetscapeCookie {
  domain: string;
  includeSubdomain: boolean;
  path: string;
  secure: boolean;
  expiry: number;
  name: string;
  value: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  line?: number;
}

export type ConversionMode = 'JSON_TO_NETSCAPE' | 'NETSCAPE_TO_JSON';