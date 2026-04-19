"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface LocationNames {
  location1Name: string;
  location2Name: string;
}

export const LocationNamesContext = createContext<LocationNames>({
  location1Name: "Hagga",
  location2Name: "Deep Desert",
});

export function LocationNamesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [names, setNames] = useState<LocationNames>({
    location1Name: "Hagga",
    location2Name: "Deep Desert",
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/global-settings", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.location1Name && data?.location2Name) {
          setNames({
            location1Name: data.location1Name,
            location2Name: data.location2Name,
          });
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          // fall back to defaults silently
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <LocationNamesContext.Provider value={names}>
      {children}
    </LocationNamesContext.Provider>
  );
}

export function useLocationNames(): LocationNames {
  return useContext(LocationNamesContext);
}
