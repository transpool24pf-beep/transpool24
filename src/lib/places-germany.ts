/**
 * Google Places (legacy REST) — Germany-only suggestions + details.
 * Uses server-side GOOGLE_MAPS_API_KEY. Enable "Places API" in Google Cloud.
 * Session token links Autocomplete + Place Details for billing.
 */

const AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

export type GooglePlacePrediction = {
  description: string;
  place_id: string;
};

export type GooglePlaceDetailsResult = {
  formatted_address: string;
  lat: number;
  lng: number;
  street: string | null;
  houseNumber: string | null;
  postcode: string | null;
};

function parseAddressComponents(
  components: { long_name: string; types: string[] }[] | undefined
): { street: string | null; houseNumber: string | null; postcode: string | null } {
  if (!components?.length) return { street: null, houseNumber: null, postcode: null };
  let street = "";
  let houseNumber = "";
  let postcode = "";
  for (const c of components) {
    if (c.types.includes("street_number")) houseNumber = c.long_name;
    if (c.types.includes("route")) street = c.long_name;
    if (c.types.includes("postal_code")) postcode = c.long_name;
  }
  return {
    street: street || null,
    houseNumber: houseNumber || null,
    postcode: postcode || null,
  };
}

export async function googlePlacesAutocompleteGermany(
  input: string,
  sessionToken: string,
  apiKey: string
): Promise<GooglePlacePrediction[]> {
  const trimmed = input.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    input: trimmed,
    components: "country:de",
    language: "de",
    key: apiKey,
    sessiontoken: sessionToken,
  });

  const res = await fetch(`${AUTOCOMPLETE_URL}?${params.toString()}`);
  const data = (await res.json()) as {
    status: string;
    predictions?: { description: string; place_id: string }[];
    error_message?: string;
  };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    if (data.status !== "INVALID_REQUEST") {
      console.warn("[places autocomplete]", data.status, data.error_message ?? "");
    }
    return [];
  }

  return (data.predictions ?? []).map((p) => ({
    description: p.description,
    place_id: p.place_id,
  }));
}

export async function googlePlaceDetailsGermany(
  placeId: string,
  sessionToken: string,
  apiKey: string
): Promise<GooglePlaceDetailsResult | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "formatted_address,geometry/location,address_components",
    language: "de",
    key: apiKey,
    sessiontoken: sessionToken,
  });

  const res = await fetch(`${DETAILS_URL}?${params.toString()}`);
  const data = (await res.json()) as {
    status: string;
    result?: {
      formatted_address: string;
      geometry?: { location: { lat: number; lng: number } };
      address_components?: { long_name: string; types: string[] }[];
    };
    error_message?: string;
  };

  if (data.status !== "OK" || !data.result?.formatted_address) {
    console.warn("[places details]", data.status, data.error_message ?? "");
    return null;
  }

  const loc = data.result.geometry?.location;
  const parsed = parseAddressComponents(data.result.address_components);
  if (loc == null || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    return {
      formatted_address: data.result.formatted_address,
      lat: 0,
      lng: 0,
      street: parsed.street,
      houseNumber: parsed.houseNumber,
      postcode: parsed.postcode,
    };
  }

  return {
    formatted_address: data.result.formatted_address,
    lat: loc.lat,
    lng: loc.lng,
    street: parsed.street,
    houseNumber: parsed.houseNumber,
    postcode: parsed.postcode,
  };
}
