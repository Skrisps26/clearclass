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
import { Badge } from "@/components/ui/badge";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const matches = await searchLocations(query, language);
        setResults(matches);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, language]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0 rounded-2xl">
        {/* Dialog Header */}
        <DialogHeader className="px-5 py-4 border-b border-border bg-muted/30">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-700" />
            <span>{language === "hi" ? "अपना स्कूल स्थान चुनें" : "Select Your School Location"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
            {language === "hi"
              ? "स्थान खोजें या त्वरित चयन के लिए किसी शहर पर क्लिक करें"
              : "Search any global city or pick a quick city below"}
          </DialogDescription>
        </DialogHeader>

        {/* Search Input & Quick Cities */}
        <div className="p-5 border-b border-border space-y-3.5">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                language === "hi"
                  ? "शहर या ज़िले का नाम लिखें (उदा. Delhi, Mumbai, London)..."
                  : "Search city or area (e.g., Delhi, Mumbai, London)..."
              }
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-input bg-muted/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all text-foreground placeholder:text-muted-foreground font-medium shadow-2xs"
            />
            {searching && (
              <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Quick Select Cities using shadcn Button */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2 font-mono">
              {language === "hi" ? "त्वरित चयन (Quick Cities)" : "Quick Cities"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((city) => {
                const isSelected = currentLocation?.id === city.id;
                return (
                  <Button
                    key={city.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onSelectLocation(city);
                      onClose();
                    }}
                    className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 shadow-2xs"
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] opacity-70 font-mono">({city.countryCode})</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto max-h-64 p-3 divide-y divide-border/60">
          {query.trim().length >= 3 && results.length === 0 && !searching && (
            <div className="py-8 text-center text-xs text-muted-foreground font-medium">
              {language === "hi"
                ? "कोई स्थान नहीं मिला। सटीक नाम लिखकर पुनः प्रयास करें।"
                : "No matching places found. Try entering a different city name."}
            </div>
          )}

          {results.map((place) => (
            <button
              key={place.id}
              onClick={() => {
                onSelectLocation(place);
                onClose();
              }}
              className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-muted/50 flex items-center justify-between transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{place.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[place.admin1, place.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {place.timezone}
              </Badge>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
