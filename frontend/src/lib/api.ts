import { DailyCard, DailyCardSchema, CardLocation, CardLocationSchema, SchoolTemplate } from "../types/card";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://04ixg1iqd4.execute-api.ap-southeast-2.amazonaws.com";

export async function fetchSchools(): Promise<{ schools: SchoolTemplate[]; scenarios: string[] }> {
  const res = await fetch(`${API_BASE_URL}/schools`);
  if (!res.ok) {
    throw new Error(`Failed to fetch schools: ${res.status}`);
  }
  return res.json();
}

export async function searchLocations(query: string, lang: string = "en"): Promise<CardLocation[]> {
  if (query.trim().length < 3) return [];
  const url = new URL(`${API_BASE_URL}/locations`);
  url.searchParams.set("query", query.trim());
  url.searchParams.set("lang", lang);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Location search failed: ${res.status}`);
  }
  const data = await res.json();
  const parsed = CardLocationSchema.array().safeParse(data.locations);
  if (!parsed.success) {
    return data.locations || [];
  }
  return parsed.data;
}

export async function fetchBrief(
  schoolId: string,
  locationId?: number,
  scenario?: string,
  lang: string = "en"
): Promise<DailyCard> {
  const url = new URL(`${API_BASE_URL}/schools/${encodeURIComponent(schoolId)}/brief`);
  if (locationId) {
    url.searchParams.set("locationId", locationId.toString());
  }
  if (scenario) {
    url.searchParams.set("scenario", scenario);
  }
  url.searchParams.set("lang", lang);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${res.status} error fetching brief`);
  }
  const json = await res.json();
  return DailyCardSchema.parse(json);
}
