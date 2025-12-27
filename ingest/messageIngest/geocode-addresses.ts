import {
  geocodeAddresses,
  geocodeIntersectionsForStreets,
} from "@/lib/geocoding-router";
import { Address, ExtractedData, StreetSection } from "@/lib/types";

// Internal types for the geocoding pipeline
export interface GeocodingResult {
  preGeocodedMap: Map<string, { lat: number; lng: number }>;
  addresses: Address[];
}

/**
 * Helper: Find missing street endpoints that haven't been geocoded
 * Exported for unit testing
 */
export function findMissingStreetEndpoints(
  streets: StreetSection[],
  geocodedMap: Map<string, { lat: number; lng: number }>
): string[] {
  const missing: string[] = [];

  streets.forEach((street) => {
    if (!geocodedMap.has(street.from)) {
      missing.push(street.from);
    }
    if (!geocodedMap.has(street.to)) {
      missing.push(street.to);
    }
  });

  return missing;
}

/**
 * Step 4: Geocode addresses from extracted data using hybrid approach
 * Google for pins, Overpass for street intersections
 */
export async function geocodeAddressesFromExtractedData(
  extractedData: ExtractedData | null
): Promise<GeocodingResult> {
  const preGeocodedMap = new Map<string, { lat: number; lng: number }>();
  let addresses: Address[] = [];

  if (!extractedData) {
    return { preGeocodedMap, addresses };
  }

  // Geocode pins using Google
  if (extractedData.pins.length > 0) {
    const pinAddresses = extractedData.pins.map((pin) => pin.address);
    const geocodedPins = await geocodeAddresses(pinAddresses);
    addresses.push(...geocodedPins);

    geocodedPins.forEach((addr) => {
      preGeocodedMap.set(addr.originalText, addr.coordinates);
    });
  }

  // Geocode street intersections using Overpass
  if (extractedData.streets.length > 0) {
    const streetGeocodedMap = await geocodeIntersectionsForStreets(
      extractedData.streets
    );

    // Merge into preGeocodedMap and create Address objects for the addresses array
    streetGeocodedMap.forEach((coords, key) => {
      preGeocodedMap.set(key, coords);

      // Add to addresses array for UI display
      addresses.push({
        originalText: key,
        formattedAddress: key,
        coordinates: coords,
        geoJson: {
          type: "Point",
          coordinates: [coords.lng, coords.lat],
        },
      });
    });

    // Check for missing endpoints and try fallback geocoding
    const missingEndpoints = findMissingStreetEndpoints(
      extractedData.streets,
      preGeocodedMap
    );

    if (missingEndpoints.length > 0) {
      const fallbackGeocoded = await geocodeAddresses(missingEndpoints);

      fallbackGeocoded.forEach((addr) => {
        preGeocodedMap.set(addr.originalText, addr.coordinates);
        addresses.push(addr);
      });
    }
  }

  return { preGeocodedMap, addresses };
}
