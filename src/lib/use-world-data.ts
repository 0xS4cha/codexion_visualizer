"use client";

import { useEffect, useState } from "react";

export const WORLD_GEOJSON =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_110m_admin_0_countries.geojson";

export interface WorldFeatureProperties {
  NAME_LONG: string;
  ISO_A2_EH: string;
}

export type WorldData = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  WorldFeatureProperties
>;

let cache: Promise<WorldData> | null = null;

function loadWorld(url: string): Promise<WorldData> {
  if (url !== WORLD_GEOJSON) {
    return fetch(url, { cache: "force-cache" }).then((res) => res.json() as Promise<WorldData>);
  }
  cache ??= fetch(url, { cache: "force-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load world map (${res.status})`);
      return res.json() as Promise<WorldData>;
    })
    .catch((error) => {
      cache = null;
      throw error;
    });
  return cache;
}

export function useWorldData(url: string = WORLD_GEOJSON): { world: WorldData | null; error: boolean } {
  const [world, setWorld] = useState<WorldData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    loadWorld(url)
      .then((data) => {
        if (active) setWorld(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [url]);

  return { world, error };
}
