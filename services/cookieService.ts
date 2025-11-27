import { JsonCookie, NetscapeCookie, ConversionMode, ValidationIssue } from '../types';

const NETSCAPE_HEADER = `# Netscape HTTP Cookie File
# http://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

`;

/**
 * Logic adapted from the user's Python script to ensure consistency.
 */
export const jsonToNetscape = (jsonString: string): string => {
  let cookies: JsonCookie[] = [];
  try {
    cookies = JSON.parse(jsonString);
    if (!Array.isArray(cookies)) throw new Error("JSON must be an array");
  } catch (e) {
    throw new Error("Invalid JSON format");
  }

  const defaultExpiry = Math.floor((Date.now() / 1000) + (7300 * 24 * 60 * 60)); // ~20 years

  const lines = cookies.map((cookie) => {
    const domainInput = cookie.domain || '';
    
    // Determine includeSubdomain. 
    // Logic: If hostOnly is false, then includeSubdomain is TRUE. 
    // Or if includeSubdomain is explicitly in JSON.
    let includeSubdomain = false;
    if (typeof cookie.includeSubdomain === 'boolean') {
      includeSubdomain = cookie.includeSubdomain;
    } else if (typeof cookie.hostOnly === 'boolean') {
      includeSubdomain = !cookie.hostOnly;
    } else {
      // Default fallback if neither exist, usually assume subdomain inclusion if domain starts with .
      includeSubdomain = domainInput.startsWith('.');
    }

    const includeSubdomainStr = includeSubdomain ? 'TRUE' : 'FALSE';
    const path = cookie.path || '/';
    const secure = cookie.secure ? 'TRUE' : 'FALSE';
    const name = cookie.name || '';
    const value = cookie.value || '';

    // Domain Logic from Python Script
    let domain = domainInput.replace(/^\./, ''); // lstrip('.')
    
    if (includeSubdomainStr === 'TRUE' && !domain.startsWith('.')) {
       // Python logic: prefer explicit dot for compatibility
       domain = '.' + domain;
    } else if (includeSubdomainStr === 'FALSE' && domain.startsWith('.')) {
       domain = domain.replace(/^\./, '');
    }

    // Expiry Logic
    let expiry = defaultExpiry;
    if (typeof cookie.expirationDate === 'number') {
      expiry = Math.floor(cookie.expirationDate);
    } 
    // Handle string dates if necessary (simplified from Python's robust logic)
    
    return `${domain}\t${includeSubdomainStr}\t${path}\t${secure}\t${expiry}\t${name}\t${value}`;
  });

  return NETSCAPE_HEADER + lines.join('\n');
};

export const netscapeToJson = (netscapeString: string): string => {
  const lines = netscapeString.split(/\r?\n/);
  const cookies: JsonCookie[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const parts = trimmed.split('\t');
    if (parts.length < 7) return;

    const [domain, includeSubdomainStr, path, secureStr, expiryStr, name, value] = parts;

    const includeSubdomain = includeSubdomainStr.toUpperCase() === 'TRUE';
    const secure = secureStr.toUpperCase() === 'TRUE';
    const expirationDate = parseInt(expiryStr, 10);
    
    // Reverse Mapping Logic
    const hostOnly = !includeSubdomain;

    const cookie: JsonCookie = {
      domain,
      expirationDate,
      hostOnly,
      httpOnly: false, // Netscape format does not store httpOnly, defaulting to false or inferring is impossible safely
      name,
      path,
      sameSite: null, // Not stored in Netscape
      secure,
      session: false, // Assuming it has an expiry means it's not session, but Netscape expiry 0 usually means session
      storeId: null,
      value
    };

    cookies.push(cookie);
  });

  if (cookies.length === 0 && lines.length > 0 && !lines[0].startsWith('#')) {
      throw new Error("Could not parse Netscape format. Ensure fields are tab-separated.");
  }

  return JSON.stringify(cookies, null, 4);
};

export const validateCookies = (input: string, mode: ConversionMode): ValidationIssue[] => {
  if (!input.trim()) return [];
  const issues: ValidationIssue[] = [];

  if (mode === 'JSON_TO_NETSCAPE') {
    try {
      // Basic syntax check
      let data: any;
      try {
        data = JSON.parse(input);
      } catch (e) {
        return [{ type: 'error', message: 'Invalid JSON syntax. Ensure usage of quotes and correct brackets.' }];
      }

      if (!Array.isArray(data)) {
        return [{ type: 'error', message: 'Root element must be a JSON array (start with [ and end with ]).' }];
      }

      data.forEach((item: any, idx: number) => {
        const lineRef = idx + 1; // logical item number
        if (typeof item !== 'object' || item === null) {
          issues.push({ type: 'error', message: 'Item is not an object', line: lineRef });
          return;
        }

        // Required fields for a valid cookie in most contexts
        if (!item.domain) issues.push({ type: 'error', message: "Missing required field: 'domain'", line: lineRef });
        if (!item.name) issues.push({ type: 'error', message: "Missing required field: 'name'", line: lineRef });
        if (item.value === undefined) issues.push({ type: 'error', message: "Missing required field: 'value'", line: lineRef });

        // Type checks
        if (item.expirationDate && typeof item.expirationDate !== 'number') {
           issues.push({ type: 'warning', message: "'expirationDate' should be a number (timestamp)", line: lineRef });
        }
        if (item.secure !== undefined && typeof item.secure !== 'boolean') {
           issues.push({ type: 'warning', message: "'secure' should be a boolean", line: lineRef });
        }
      });

    } catch (e) {
      issues.push({ type: 'error', message: 'Unexpected error during validation.' });
    }
  } else {
    // NETSCAPE_TO_JSON validation
    const lines = input.split('\n');
    let hasHeader = false;
    
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();
      
      if (!trimmed) return;
      
      if (trimmed.startsWith('#')) {
        if (trimmed.includes('Netscape HTTP Cookie File')) hasHeader = true;
        return;
      }

      const parts = line.split('\t');
      // If split by tab results in 1, maybe they pasted spaces?
      if (parts.length === 1 && line.includes(' ')) {
         issues.push({ type: 'warning', message: 'Line appears to use spaces instead of tabs. Netscape format requires tabs.', line: lineNum });
      }

      if (parts.length < 7) {
        // Only report error if it doesn't look like a comment or empty line
        if (parts.length > 1) {
            issues.push({ type: 'error', message: `Insufficient fields. Expected 7 tab-separated columns, found ${parts.length}.`, line: lineNum });
        }
      } else {
        // [domain, includeSubdomains, path, secure, expiry, name, value]
        // Index 1: includeSubdomains
        const includeSub = parts[1].toUpperCase();
        if (includeSub !== 'TRUE' && includeSub !== 'FALSE') {
          issues.push({ type: 'error', message: `Column 2 (Include Subdomains) must be TRUE or FALSE. Found "${parts[1]}"`, line: lineNum });
        }
        
        // Index 3: secure
        const secure = parts[3].toUpperCase();
        if (secure !== 'TRUE' && secure !== 'FALSE') {
           issues.push({ type: 'error', message: `Column 4 (Secure) must be TRUE or FALSE. Found "${parts[3]}"`, line: lineNum });
        }

        // Index 4: expiry
        const expiry = parseInt(parts[4], 10);
        if (isNaN(expiry)) {
           issues.push({ type: 'error', message: `Column 5 (Expiration) must be a numeric timestamp. Found "${parts[4]}"`, line: lineNum });
        }
      }
    });

    if (!hasHeader && lines.length > 0) {
      issues.push({ type: 'warning', message: 'Missing standard Netscape header (# Netscape HTTP Cookie File). Some tools may not recognize this file.' });
    }
  }

  return issues;
};