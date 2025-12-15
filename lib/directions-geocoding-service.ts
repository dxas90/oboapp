import { Address } from "./types";

// Constants for API rate limiting
const DIRECTIONS_BATCH_DELAY_MS = 200;

interface LatLng {
  lat: number;
  lng: number;
}

interface DirectionsStep {
  start_location: LatLng;
  end_location: LatLng;
  html_instructions?: string;
  maneuver?: string;
  polyline?: {
    points: string;
  };
}

interface DirectionsLeg {
  steps: DirectionsStep[];
}

interface DirectionsRoute {
  legs: DirectionsLeg[];
  overview_polyline?: {
    points: string;
  };
}

interface DirectionsResponse {
  status: string;
  routes: DirectionsRoute[];
  error_message?: string;
}

/**
 * Geocodes a simple address (for compatibility with traditional geocoding)
 * For intersections, use geocodeIntersection instead
 *
 * @param address Address string (can be simple address or intersection)
 * @returns Address object or null
 */
export async function geocodeAddress(address: string): Promise<Address | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key not configured");
      return null;
    }

    const encodedAddress = encodeURIComponent(`${address}, Sofia, Bulgaria`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        originalText: address,
        formattedAddress: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        geoJson: {
          type: "Point",
          coordinates: [
            result.geometry.location.lng,
            result.geometry.location.lat,
          ],
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

/**
 * Checks if a step contains a reference to the target street
 */
function stepReferencesStreet(
  step: DirectionsStep,
  streetName: string
): boolean {
  if (!step.html_instructions) return false;

  const instructions = step.html_instructions.toLowerCase();
  const streetLower = streetName.toLowerCase();

  return instructions.includes(streetLower);
}

/**
 * Finds the intersection step in a route
 */
function findIntersectionStep(
  steps: DirectionsStep[],
  streetB: string
): DirectionsStep | null {
  // Find the first step with a maneuver or that references Street B
  for (const step of steps) {
    // Check if this step has a maneuver (turn)
    if (step.maneuver) {
      console.log(`   Found step with maneuver: ${step.maneuver}`);
      return step;
    }

    // Check if html_instructions reference Street B
    if (stepReferencesStreet(step, streetB)) {
      console.log(`   Found step referencing target street: ${streetB}`);
      return step;
    }
  }

  return null;
}

/**
 * Finds the intersection point between two streets using Google Directions API
 *
 * Strategy:
 * 1. Request walking directions from Street A to Street B
 * 2. Find the step where the route turns or references Street B
 * 3. Use that step's location as the intersection point
 *
 * If the direct route doesn't go through the intersection, try reverse direction.
 *
 * Walking mode is used because:
 * - Ignores one-way streets and turn restrictions
 * - Symmetric (Street A ↔ Street B works both ways)
 * - More stable for topological intersections
 *
 * @param streetA First street name
 * @param streetB Second street name
 * @returns Coordinates of the intersection, or null if not found
 */
export async function findIntersection(
  streetA: string,
  streetB: string
): Promise<LatLng | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key not configured");
      return null;
    }

    // Try both directions and pick the one that actually goes through the intersection
    console.log(
      `\n🔍 Attempting to find intersection: "${streetA}" ∩ "${streetB}"`
    );

    // Try forward direction first
    const forwardResult = await tryDirectionForIntersection(
      streetA,
      streetB,
      apiKey
    );

    // Try reverse direction
    const reverseResult = await tryDirectionForIntersection(
      streetB,
      streetA,
      apiKey
    );

    // Pick the better result (one with a maneuver is better than fallback)
    if (forwardResult?.foundViaManeuver && !reverseResult?.foundViaManeuver) {
      console.log(`✅ Using forward direction result (has maneuver)`);
      return forwardResult.location;
    }

    if (reverseResult?.foundViaManeuver && !forwardResult?.foundViaManeuver) {
      console.log(`✅ Using reverse direction result (has maneuver)`);
      return reverseResult.location;
    }

    // Both have maneuvers or both are fallbacks - use forward
    if (forwardResult?.location) {
      console.log(`✅ Using forward direction result`);
      return forwardResult.location;
    }

    if (reverseResult?.location) {
      console.log(`✅ Using reverse direction result`);
      return reverseResult.location;
    }

    console.warn(`❌ Could not find intersection in either direction`);
    return null;
  } catch (error) {
    console.error(
      `Error finding intersection between ${streetA} and ${streetB}:`,
      error
    );
    return null;
  }
}

/**
 * Helper function to try finding intersection in one direction
 */
async function tryDirectionForIntersection(
  origin: string,
  destination: string,
  apiKey: string
): Promise<{ location: LatLng; foundViaManeuver: boolean } | null> {
  const originEncoded = encodeURIComponent(`${origin}, Sofia, Bulgaria`);
  const destinationEncoded = encodeURIComponent(
    `${destination}, Sofia, Bulgaria`
  );

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originEncoded}&destination=${destinationEncoded}&mode=walking&key=${apiKey}`;

  // Log the navigation URL for manual testing
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${originEncoded}&destination=${destinationEncoded}&travelmode=walking`;
  console.log(`\n🗺️ Trying: ${origin} → ${destination}`);
  console.log(`   Navigation: ${navigationUrl}`);

  const response = await fetch(url);
  const data: DirectionsResponse = await response.json();

  // Log the complete API response for debugging
  console.log(`\n📍 Directions API Response:`);
  console.log(JSON.stringify(data, null, 2));

  if (data.status === "OK" && data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const leg = route.legs[0];

    if (!leg?.steps?.length) {
      console.warn(`   No steps found`);
      return null;
    }

    // Log all steps for debugging
    console.log(`\n📊 Route has ${leg.steps.length} steps:`);
    leg.steps.forEach((step, i) => {
      console.log(`  Step ${i + 1}: ${step.html_instructions || "N/A"}`);
      console.log(`    Maneuver: ${step.maneuver || "none"}`);
      console.log(
        `    Start: ${step.start_location.lat}, ${step.start_location.lng}`
      );
      console.log(
        `    End: ${step.end_location.lat}, ${step.end_location.lng}`
      );
    });

    // Find the intersection step
    const intersectionStep = findIntersectionStep(leg.steps, destination);
    if (intersectionStep?.maneuver) {
      console.log(
        `   ✅ Found via maneuver at: ${intersectionStep.start_location.lat}, ${intersectionStep.start_location.lng}`
      );
      console.log(
        `   Google Maps: https://www.google.com/maps/@${intersectionStep.start_location.lat},${intersectionStep.start_location.lng},19z`
      );
      return {
        location: intersectionStep.start_location,
        foundViaManeuver: true,
      };
    } else if (intersectionStep) {
      console.log(
        `   ⚠️ Found via street reference (no maneuver) at: ${intersectionStep.start_location.lat}, ${intersectionStep.start_location.lng}`
      );
      return {
        location: intersectionStep.start_location,
        foundViaManeuver: false,
      };
    }

    // Fallback: use the last step's end location (destination)
    const lastStep = leg.steps.at(-1);
    if (lastStep) {
      console.log(
        `   ⚠️ Fallback: using destination at ${lastStep.end_location.lat}, ${lastStep.end_location.lng}`
      );
      return {
        location: lastStep.end_location,
        foundViaManeuver: false,
      };
    }
  }

  console.warn(`   ❌ API returned status: ${data.status}`);
  return null;
}

/**
 * Gets driving directions between two points and returns the route polyline
 *
 * @param from Starting coordinates
 * @param to Ending coordinates
 * @returns Encoded polyline string, or null if not found
 */
export async function getRoutePolyline(
  from: LatLng,
  to: LatLng
): Promise<string | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key not configured");
      return null;
    }

    const origin = `${from.lat},${from.lng}`;
    const destination = `${to.lat},${to.lng}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${apiKey}`;

    const response = await fetch(url);
    const data: DirectionsResponse = await response.json();

    if (data.status === "OK" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];

      // Use overview_polyline if available, otherwise concatenate step polylines
      if (route.overview_polyline?.points) {
        return route.overview_polyline.points;
      }

      console.warn("No overview polyline found in route");
      return null;
    }

    console.warn(`Directions API returned status: ${data.status} for route`);
    return null;
  } catch (error) {
    console.error("Error getting route polyline:", error);
    return null;
  }
}

/**
 * Decodes a Google Maps encoded polyline into an array of coordinates
 *
 * Algorithm from: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * @param encoded Encoded polyline string
 * @returns Array of [longitude, latitude] coordinates (GeoJSON format)
 */
export function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    // Decode latitude
    do {
      // Using codePointAt for ASCII characters in encoded polyline
      b = (encoded.codePointAt(index++) ?? 0) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      // Using codePointAt for ASCII characters in encoded polyline
      b = (encoded.codePointAt(index++) ?? 0) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    // Coordinates are stored as integers (multiplied by 1e5)
    // Return in GeoJSON format: [longitude, latitude]
    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

/**
 * Creates a buffered polygon around a LineString
 *
 * Simple implementation: creates a rectangular buffer around each segment
 * For production use, consider using a proper geometry library like Turf.js
 *
 * @param lineCoordinates Array of [longitude, latitude] coordinates
 * @param bufferMeters Buffer distance in meters
 * @returns Polygon coordinates in GeoJSON format
 */
export function bufferLineString(
  lineCoordinates: [number, number][],
  bufferMeters: number = 10
): [number, number][][] {
  if (lineCoordinates.length < 2) {
    return [];
  }

  // Approximate degrees per meter at Sofia's latitude (42.7°)
  // At this latitude: 1° lat ≈ 111,000m, 1° lng ≈ 82,000m
  const metersPerDegreeLat = 111000;
  const metersPerDegreeLng = 82000;

  const bufferLat = bufferMeters / metersPerDegreeLat;
  const bufferLng = bufferMeters / metersPerDegreeLng;

  // Create a simple envelope around all points
  const lngs = lineCoordinates.map((coord) => coord[0]);
  const lats = lineCoordinates.map((coord) => coord[1]);

  const minLng = Math.min(...lngs) - bufferLng;
  const maxLng = Math.max(...lngs) + bufferLng;
  const minLat = Math.min(...lats) - bufferLat;
  const maxLat = Math.max(...lats) + bufferLat;

  // Return a rectangular polygon
  // First and last coordinates must be the same (closed ring)
  return [
    [
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat], // Close the ring
    ],
  ];
}

/**
 * Geocodes an intersection using Directions API
 *
 * @param streetA First street name
 * @param streetB Second street name
 * @returns Address object with intersection coordinates, or null if failed
 */
export async function geocodeIntersection(
  streetA: string,
  streetB: string
): Promise<Address | null> {
  try {
    console.log(`\n🔍 Geocoding intersection: "${streetA}" ∩ "${streetB}"`);

    const intersection = await findIntersection(streetA, streetB);

    if (!intersection) {
      console.warn(`❌ Could not find intersection: ${streetA} ∩ ${streetB}`);
      return null;
    }

    const originalText = `${streetA} ∩ ${streetB}`;
    const formattedAddress = `${streetA} and ${streetB}, Sofia, Bulgaria`;

    console.log(`✅ Intersection geocoded:`);
    console.log(`   Original: ${originalText}`);
    console.log(`   Formatted: ${formattedAddress}`);
    console.log(`   Coordinates: ${intersection.lat}, ${intersection.lng}`);
    console.log(
      `   Google Maps: https://www.google.com/maps/@${intersection.lat},${intersection.lng},19z`
    );

    return {
      originalText,
      formattedAddress,
      coordinates: intersection,
      geoJson: {
        type: "Point",
        coordinates: [intersection.lng, intersection.lat],
      },
    };
  } catch (error) {
    console.error(
      `Error geocoding intersection ${streetA} ∩ ${streetB}:`,
      error
    );
    return null;
  }
}

/**
 * Geocodes a street section between two intersections
 * Creates a LineString from the route and optionally a buffered Polygon
 *
 * @param street Street name
 * @param fromStreet Intersection starting street
 * @param toStreet Intersection ending street
 * @param bufferMeters Optional buffer distance in meters for polygon
 * @returns Address object with LineString/Polygon geometry, or null if failed
 */
export async function geocodeStreetSection(
  street: string,
  fromStreet: string,
  toStreet: string,
  bufferMeters?: number
): Promise<Address | null> {
  try {
    // Find both intersections
    const fromIntersection = await findIntersection(street, fromStreet);
    await new Promise((resolve) =>
      setTimeout(resolve, DIRECTIONS_BATCH_DELAY_MS)
    );

    const toIntersection = await findIntersection(street, toStreet);
    await new Promise((resolve) =>
      setTimeout(resolve, DIRECTIONS_BATCH_DELAY_MS)
    );

    if (!fromIntersection || !toIntersection) {
      console.warn(
        `Could not find intersections for street section: ${street} from ${fromStreet} to ${toStreet}`
      );
      return null;
    }

    // Get driving route between intersections
    const polyline = await getRoutePolyline(fromIntersection, toIntersection);

    if (!polyline) {
      console.warn(
        `Could not get route for street section: ${street} from ${fromStreet} to ${toStreet}`
      );
      return null;
    }

    // Decode polyline to coordinates
    const lineCoordinates = decodePolyline(polyline);

    const originalText = `${street} from ${fromStreet} to ${toStreet}`;
    const formattedAddress = `${street} between ${fromStreet} and ${toStreet}, Sofia, Bulgaria`;

    // Calculate center point for coordinates (midpoint of line)
    const midIndex = Math.floor(lineCoordinates.length / 2);
    const midPoint = lineCoordinates[midIndex];

    // Create GeoJSON based on whether buffering is requested
    if (bufferMeters && bufferMeters > 0) {
      const polygonCoordinates = bufferLineString(
        lineCoordinates,
        bufferMeters
      );

      return {
        originalText,
        formattedAddress,
        coordinates: {
          lat: midPoint[1],
          lng: midPoint[0],
        },
        geoJson: {
          type: "Polygon",
          coordinates: polygonCoordinates,
        } as any, // Type assertion needed due to union type
      };
    } else {
      return {
        originalText,
        formattedAddress,
        coordinates: {
          lat: midPoint[1],
          lng: midPoint[0],
        },
        geoJson: {
          type: "LineString",
          coordinates: lineCoordinates,
        } as any, // Type assertion needed due to union type
      };
    }
  } catch (error) {
    console.error(
      `Error geocoding street section ${street} from ${fromStreet} to ${toStreet}:`,
      error
    );
    return null;
  }
}

/**
 * Batch geocode multiple intersections with rate limiting
 *
 * @param intersections Array of [streetA, streetB] tuples
 * @returns Array of successfully geocoded addresses
 */
export async function geocodeIntersections(
  intersections: [string, string][]
): Promise<Address[]> {
  const geocodedAddresses: Address[] = [];

  console.log(
    `\n📍 Batch geocoding ${intersections.length} intersections using Directions API...`
  );

  for (const [streetA, streetB] of intersections) {
    const geocoded = await geocodeIntersection(streetA, streetB);

    if (geocoded) {
      geocodedAddresses.push(geocoded);
    } else {
      console.warn(
        `❌ Failed to geocode intersection: ${streetA} ∩ ${streetB}`
      );
    }

    // Add delay to avoid hitting rate limits
    await new Promise((resolve) =>
      setTimeout(resolve, DIRECTIONS_BATCH_DELAY_MS)
    );
  }

  console.log(
    `\n✅ Successfully geocoded ${geocodedAddresses.length}/${intersections.length} intersections`
  );

  return geocodedAddresses;
}

/**
 * Batch geocode multiple street sections with rate limiting
 *
 * @param sections Array of [street, fromStreet, toStreet] tuples
 * @param bufferMeters Optional buffer distance in meters for polygons
 * @returns Array of successfully geocoded addresses
 */
export async function geocodeStreetSections(
  sections: [string, string, string][],
  bufferMeters?: number
): Promise<Address[]> {
  const geocodedAddresses: Address[] = [];

  for (const [street, fromStreet, toStreet] of sections) {
    const geocoded = await geocodeStreetSection(
      street,
      fromStreet,
      toStreet,
      bufferMeters
    );

    if (geocoded) {
      geocodedAddresses.push(geocoded);
      console.log(
        "Street section:",
        `${street} from ${fromStreet} to ${toStreet}`,
        "geocoded to",
        geocoded.formattedAddress,
        "Geometry type:",
        geocoded.geoJson?.type
      );
    } else {
      console.warn(
        `Failed to geocode street section: ${street} from ${fromStreet} to ${toStreet}`
      );
    }

    // Add delay to avoid hitting rate limits (street sections make multiple API calls)
    await new Promise((resolve) =>
      setTimeout(resolve, DIRECTIONS_BATCH_DELAY_MS * 2)
    );
  }

  return geocodedAddresses;
}

/**
 * Get street geometry between two points using Google Directions API
 * Returns decoded polyline coordinates
 *
 * @param startCoords Starting point coordinates
 * @param endCoords Ending point coordinates
 * @returns Array of [longitude, latitude] coordinates, or null if failed
 */
export async function getGoogleStreetGeometry(
  startCoords: { lat: number; lng: number },
  endCoords: { lat: number; lng: number }
): Promise<[number, number][] | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key not configured");
      return null;
    }

    const origin = `${startCoords.lat},${startCoords.lng}`;
    const destination = `${endCoords.lat},${endCoords.lng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${apiKey}`;

    const response = await fetch(url);
    const data: DirectionsResponse = await response.json();

    if (data.status === "OK" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const polyline = route.overview_polyline?.points;

      if (polyline) {
        const coordinates = decodePolyline(polyline);
        console.log(
          `   ✅ Google Directions: Retrieved geometry with ${coordinates.length} points`
        );
        return coordinates;
      } else {
        console.error("No polyline found in route response");
        // Fall back to simple straight line
        return [
          [startCoords.lng, startCoords.lat],
          [endCoords.lng, endCoords.lat],
        ];
      }
    }

    // Provide more detailed error information
    if (data.status === "OK" && (!data.routes || data.routes.length === 0)) {
      console.error(
        "API returned OK but no routes found, using fallback straight line"
      );
      // Fall back to simple straight line
      return [
        [startCoords.lng, startCoords.lat],
        [endCoords.lng, endCoords.lat],
      ];
    } else {
      console.error(
        "Failed to retrieve geometry. API status:",
        data.status,
        "Error message:",
        data.error_message || "None"
      );
      // Fall back to simple straight line
      return [
        [startCoords.lng, startCoords.lat],
        [endCoords.lng, endCoords.lat],
      ];
    }
  } catch (error) {
    console.error("Error getting Google street geometry:", error);
    // Fall back to simple straight line
    return [
      [startCoords.lng, startCoords.lat],
      [endCoords.lng, endCoords.lat],
    ];
  }
}
