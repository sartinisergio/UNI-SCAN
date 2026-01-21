import React, { createContext, useContext, useEffect, useState } from "react";

export const PUBLISHERS = [
  "Zanichelli",
  "Piccin",
  "Edises",
  "McGraw-Hill",
  "Pearson",
  "Edi-Ermes",
  "Apogeo",
  "Giappichelli",
  "Il Mulino",
  "Idelson Gnocchi",
];

const PUBLISHER_STORAGE_KEY = "selected-publisher";
const DEFAULT_PUBLISHER = "Zanichelli";

interface PublisherContextType {
  selectedPublisher: string;
  setSelectedPublisher: (publisher: string) => void;
}

const PublisherContext = createContext<PublisherContextType | undefined>(
  undefined
);

export function PublisherProvider({ children }: { children: React.ReactNode }) {
  const [selectedPublisher, setSelectedPublisherState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(PUBLISHER_STORAGE_KEY) || DEFAULT_PUBLISHER;
    }
    return DEFAULT_PUBLISHER;
  });

  const setSelectedPublisher = (publisher: string) => {
    setSelectedPublisherState(publisher);
    if (typeof window !== "undefined") {
      localStorage.setItem(PUBLISHER_STORAGE_KEY, publisher);
    }
  };

  return (
    <PublisherContext.Provider value={{ selectedPublisher, setSelectedPublisher }}>
      {children}
    </PublisherContext.Provider>
  );
}

export function usePublisher() {
  const context = useContext(PublisherContext);
  if (!context) {
    throw new Error("usePublisher must be used within PublisherProvider");
  }
  return context;
}
