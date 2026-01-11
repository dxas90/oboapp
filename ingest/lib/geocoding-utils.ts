/**
 * Shared utilities for geocoding services
 */

import {
  SOFIA_BOUNDS,
  SOFIA_CENTER,
  SOFIA_BBOX,
  isWithinSofia,
} from "./bounds";

// Re-export for backward compatibility
export { SOFIA_BOUNDS, SOFIA_CENTER, SOFIA_BBOX, isWithinSofia };

/**
 * Check if coordinates match Sofia's exact center (rounded to 4 decimal places)
 * This detects Google's fallback to city center when it can't find a specific location
 */
export function isSofiaCenterFallback(lat: number, lng: number): boolean {
  // Round to 4 decimal places (approximately 11 meters precision)
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;

  return roundedLat === SOFIA_CENTER.lat && roundedLng === SOFIA_CENTER.lng;
}

/**
 * Check if a formatted address is too generic (city-level only)
 */
export function isGenericCityAddress(formattedAddress: string): boolean {
  const genericPatterns = [
    /^Sofia,\s*Bulgaria$/i,
    /^София,\s*България$/i,
    /^Sofia$/i,
    /^София$/i,
  ];
  return genericPatterns.some((pattern) => pattern.test(formattedAddress));
}
