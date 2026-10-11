"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { CardLocation } from "../types/card";
import { searchLocations } from "../lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: CardLocation) => void;
  currentLocation: CardLocation | null;
  language: "en" | "hi";
}

const POPULAR_CITIES: CardLocation[] = [
  {
    id: 1273294,
    name: "Delhi",
    admin1: "Delhi",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    coordinates: { latitude: 28.65195, longitude: 77.23149 },
  },
  {
    id: 1277333,
    name: "Bengaluru",
    admin1: "Karnataka",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    coordinates: { latitude: 12.97194, longitude: 77.59369 },
  },
  {
    id: 1275339,
    name: "Mumbai",
    admin1: "Maharashtra",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    coordinates: { latitude: 19.07283, longitude: 72.88261 },
  },
  {
    id: 2643743,
    name: "London",
    admin1: "England",
    country: "United Kingdom",
    countryCode: "GB",
    timezone: "Europe/London",
    coordinates: { latitude: 51.50853, longitude: -0.12574 },
  },
  {
    id: 5128581,
    name: "New York",
    admin1: "New York",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    coordinates: { latitude: 40.71427, longitude: -74.00597 },
  },
  {
    id: 1850147,
    name: "Tokyo",
    admin1: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    timezone: "Asia/Tokyo",
    coordinates: { latitude: 35.6895, longitude: 139.69171 },
  },
];

export function LocationModal({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocation,
  language,
}: LocationModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSearching(false);
      setSearchError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      return;
    }

    let active = true;
    setSearching(true);
    setResults([]);
    setSearchError(false);

    const timer = setTimeout(async () => {
      try {
        const matches = await searchLocations(query, language);
        if (active) {
          setResults(matches);
        }
      } catch {
        if (active) {
          setResults([]);
          setSearchError(true);
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, language]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>{language === "hi" ? "अपना स्कूल स्थान चुनें" : "Select your school location"}</span>
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {language === "hi"
              ? "स्थान खोजें या त्वरित चयन के लिए किसी शहर पर क्लिक करें"
              : "Search for a city or choose a quick location below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 border-b border-border px-5 py-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={language === "hi" ? "स्थान खोजें" : "Search for a location"}
              placeholder={
                language === "hi"
                  ? "शहर या ज़िले का नाम लिखें (उदा. Delhi, Mumbai, London)"
                  : "Search city or area (e.g., Delhi, Mumbai, London)"
              }
              className="pr-10 pl-10 text-sm"
            />
            {searching && (
              <Loader2
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary"
                aria-label={language === "hi" ? "खोज जारी है" : "Searching"}
              />
            )}
          </div>

          <section aria-labelledby="quick-cities-heading">
            <h3 id="quick-cities-heading" className="mb-2 text-sm font-medium text-foreground">
              {language === "hi" ? "त्वरित चयन" : "Quick cities"}
            </h3>
            <ul className="divide-y divide-border border-y border-border">
              {POPULAR_CITIES.map((city) => {
                const isSelected = currentLocation?.id === city.id;
                return (
                  <li key={city.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        onSelectLocation(city);
                        onClose();
                      }}
                      className={`h-auto w-full justify-between rounded-none px-3 py-2.5 text-left text-sm ${
                        isSelected
                          ? "bg-secondary text-secondary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      <span>{city.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {city.countryCode}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="max-h-64 overflow-y-auto px-5 py-3">
          {searchError && query.trim().length >= 3 && (
            <p role="alert" className="py-5 text-sm text-muted-foreground">
              {language === "hi"
                ? "स्थान खोज उपलब्ध नहीं है। पुनः प्रयास करने के लिए खोज शब्द बदलें।"
                : "Location search is unavailable. Change the search text to try again."}
            </p>
          )}

          {query.trim().length >= 3 && results.length === 0 && !searching && !searchError && (
            <p className="py-5 text-sm text-muted-foreground">
              {language === "hi"
                ? "कोई स्थान नहीं मिला। सटीक नाम लिखकर पुनः प्रयास करें।"
                : "No matching places found. Try entering a different city name."}
            </p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-border border-y border-border">
              {results.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLocation(place);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-4 px-3 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{place.name}</span>
                        <span className="block text-sm text-muted-foreground">
                          {[place.admin1, place.country].filter(Boolean).join(", ")}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{place.timezone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
      </Dialog>
  );
}
