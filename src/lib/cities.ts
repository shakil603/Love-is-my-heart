import type { City } from "@/lib/types";

/**
 * A small, hand-curated gazetteer. Coordinates are city-centre latitudes and
 * longitudes from the openly licensed GeoNames dataset (CC BY 4.0), rounded to
 * four decimal places. Love Is My Heart only needs city-level accuracy to compute the
 * distance between two members — no device location is ever stored.
 */
export const CITIES: City[] = [
  { name: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276 },
  { name: "Manchester", country: "United Kingdom", lat: 53.4808, lng: -2.2426 },
  { name: "Birmingham", country: "United Kingdom", lat: 52.4862, lng: -1.8904 },
  { name: "Edinburgh", country: "United Kingdom", lat: 55.9533, lng: -3.1883 },
  { name: "Bristol", country: "United Kingdom", lat: 51.4545, lng: -2.5879 },
  { name: "Brighton", country: "United Kingdom", lat: 50.8225, lng: -0.1372 },
  { name: "Leeds", country: "United Kingdom", lat: 53.8008, lng: -1.5491 },
  { name: "Glasgow", country: "United Kingdom", lat: 55.8642, lng: -4.2518 },
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { name: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
  { name: "Prague", country: "Czechia", lat: 50.0755, lng: 14.4378 },
  { name: "Istanbul", country: "Türkiye", lat: 41.0082, lng: 28.9784 },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
  { name: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194 },
  { name: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", country: "United States", lat: 41.8781, lng: -87.6298 },
  { name: "Austin", country: "United States", lat: 30.2672, lng: -97.7431 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { name: "New Delhi", country: "India", lat: 28.6139, lng: 77.209 },
  { name: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639 },
  { name: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125 },
  { name: "Chattogram", country: "Bangladesh", lat: 22.3569, lng: 91.7832 },
  { name: "Sylhet", country: "Bangladesh", lat: 24.8949, lng: 91.8687 },
  { name: "Mymensingh", country: "Bangladesh", lat: 24.7471, lng: 90.4203 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
];

export const DEFAULT_CITY = CITIES[0];

export function findCity(name: string): City | undefined {
  const needle = name.trim().toLowerCase();
  return CITIES.find(
    (city) =>
      city.name.toLowerCase() === needle ||
      `${city.name}, ${city.country}`.toLowerCase() === needle,
  );
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The nearest supported city to a browser-provided coordinate. */
export function nearestCity(lat: number, lng: number): City {
  return CITIES.reduce((closest, city) => {
    const distance = haversineKm({ lat, lng }, city);
    return distance < closest.distance ? { city, distance } : closest;
  }, { city: DEFAULT_CITY, distance: Number.POSITIVE_INFINITY }).city;
}

export function distanceLabel(km: number) {
  if (km < 1) return "Same city";
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}
