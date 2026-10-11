"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Loader2, Sparkles } from "lucide-react";
import { CardLocation } from "../types/card";
import { searchLocations } from "../lib/api";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              {language === "hi" ? "अपना स्कूल स्थान चुनें" : "Select Your School Location"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "hi"
                ? "स्थान खोजें या त्वरित चयन के लिए किसी शहर पर क्लिक करें"
                : "Type any city worldwide or click a quick-select city below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-5 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {searching && (
              <Loader2 className="w-4 h-4 text-blue-800 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Quick Select Cities */}
          <div className="mt-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {language === "hi" ? "त्वरित चयन (Quick Cities)" : "Quick Cities"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((city) => {
                const isSelected = currentLocation?.id === city.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => {
                      onSelectLocation(city);
                      onClose();
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-blue-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                    }`}
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] opacity-70">({city.countryCode})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto flex-1 p-3 divide-y divide-slate-100">
          {query.trim().length >= 3 && results.length === 0 && !searching && (
            <div className="py-8 text-center text-xs text-slate-500 font-medium">
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
              className="w-full px-3 py-2.5 rounded-lg text-left hover:bg-slate-50 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-100">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{place.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {[place.admin1, place.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {place.timezone}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
