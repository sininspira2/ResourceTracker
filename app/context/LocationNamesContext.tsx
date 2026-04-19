"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface LocationNamesContextValue {
  location1Name: string;
  location2Name: string;
  refreshLocationNames: () => Promise<void>;
}

const DEFAULT_NAMES = { location1Name: "Hagga", location2Name: "Deep Desert" };

export const LocationNamesContext = createContext<LocationNamesContextValue>({
  ...DEFAULT_NAMES,
  refreshLocationNames: async () => {},
});

export function LocationNamesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [names, setNames] = useState(DEFAULT_NAMES);

  const fetchNames = useCallback(async (signal?: AbortSignal) => {
    const r = await fetch("/api/global-settings", signal ? { signal } : {});
    if (!r.ok) return;
    const data = await r.json();
    if (data?.location1Name && data?.location2Name) {
      setNames({ location1Name: data.location1Name, location2Name: data.location2Name });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchNames(controller.signal).catch((err) => {
      if (err.name !== "AbortError") {
        // fall back to defaults silently
      }
    });
    return () => controller.abort();
  }, [fetchNames]);

  const refreshLocationNames = useCallback(async () => {
    await fetchNames();
  }, [fetchNames]);

  return (
    <LocationNamesContext.Provider value={{ ...names, refreshLocationNames }}>
      {children}
    </LocationNamesContext.Provider>
  );
}

export function useLocationNames(): LocationNamesContextValue {
  return useContext(LocationNamesContext);
}
