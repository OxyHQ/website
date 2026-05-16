/**
 * Dashboard helpers.
 *
 * NOTE: This file previously contained fabricated metrics (billions of
 * requests, system blocks, datacenter region markers, top-country charts)
 * cloned from a Vercel/Cloudflare-style dashboard. None of that data
 * reflects Oxy's real platform usage, so it has been removed.
 *
 * Real dashboard data is sourced from `usePlatformStats()` /
 * `useInfraStatus()` via the API hooks. This file only keeps the small
 * shared formatting helper.
 */

export interface CountryData {
  value: number;
  color?: string;
}

export interface RegionMarker {
  id: string;
  name: string;
  coordinates: [number, number];
}

export const topCountries: { code: string; name: string; requests: number; color: string }[] = [];
export const countryRequests: Record<string, CountryData> = {};
export const regionMarkers: RegionMarker[] = [];

export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};
