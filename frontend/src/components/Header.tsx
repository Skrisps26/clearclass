"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, School, AlertTriangle, Globe, Sparkles, Loader2, Check } from "lucide-react";
import { CardLocation, SchoolTemplate } from "../types/card";
import { searchLocations } from "../lib/api";

interface HeaderProps {
  schools: SchoolTemplate[];
  selectedSchool: string;
  onSelectSchool: (schoolId: string) => void;
  selectedLocation: CardLocation | null;
  onSelectLocation: (loc: CardLocation) => void;
  selectedScenario: string | null;
  onSelectScenario: (scenario: string | null) => void;
  language: "en" | "hi";
  onToggleLanguage: (lang: "en" | "hi") => void;
  airStatus?: string;
  stale?: boolean;
}

const SCENARIOS = [
  { id: null, label: "Live Modelled", desc: "CAMS Global 45km forecast" },
  { id: "good-day", label: "Good Day", desc: "AQI 35, PM2.5 10µg/m³" },
  { id: "moderate-day", label: "Moderate Day", desc: "AQI 75, PM2.5 35µg/m³" },
  { id: "very-poor-day", label: "Very Poor Day", desc: "AQI 200, PM2.5 125µg/m³" },
  { id: "severe-day", label: "Severe Day", desc: "AQI 350, PM2.5 250µg/m³" },
];

export function Header({
  schools,
  selectedSchool,
  onSelectSchool,
  selectedLocation,
  onSelectLocation,
  selectedScenario,
  onSelectScenario,
  language,
  onToggleLanguage,
  airStatus,
  stale,
}: HeaderProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search (300ms, min 3 chars)
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
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, language]);

  // Click outside to close combobox
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                C
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  ClearClass
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {language === "hi"
                    ? "स्कूल वायु-गुणवत्ता निर्णय प्रणाली"
                    : "School Decision Engine"}
                </p>
              </div>
            </div>

            {/* Mobile Lang Toggle */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => onToggleLanguage(language === "en" ? "hi" : "en")}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100"
              >
                <Globe className="w-3.5 h-3.5 text-blue-700" />
                {language === "en" ? "हिन्दी" : "English"}
              </button>
            </div>
          </div>

          {/* Search & Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Location Combobox */}
            <div className="relative flex-1 sm:w-72" ref={dropdownRef}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder={
                    selectedLocation
                      ? `${selectedLocation.name}, ${selectedLocation.country}`
                      : language === "hi"
                      ? "स्थान खोजें (उदा. Delhi, London)..."
                      : "Search place (e.g., Delhi, London)..."
                  }
                  className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all text-slate-900 placeholder:text-slate-500 font-medium"
                />
                {searching && (
                  <Loader2 className="w-3.5 h-3.5 text-blue-800 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {dropdownOpen && (results.length > 0 || query.trim().length >= 3) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {results.length === 0 && !searching && (
                    <div className="p-3 text-xs text-slate-500 text-center font-medium">
                      {language === "hi"
                        ? "कोई स्थान नहीं मिला। सटीक नाम लिखें।"
                        : "No places found. Enter a valid city or district."}
                    </div>
                  )}
                  {results.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => {
                        onSelectLocation(place);
                        setQuery("");
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {place.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {[place.admin1, place.country].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {place.timezone}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* School Profile Dropdown */}
            <div className="relative">
              <select
                value={selectedSchool}
                onChange={(e) => onSelectSchool(e.target.value)}
                className="py-1.5 pl-2.5 pr-7 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario Switcher */}
            <div className="relative">
              <select
                value={selectedScenario || ""}
                onChange={(e) => onSelectScenario(e.target.value ? e.target.value : null)}
                className="py-1.5 pl-2.5 pr-7 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              >
                {SCENARIOS.map((sc) => (
                  <option key={sc.id || "live"} value={sc.id || ""}>
                    {sc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Lang Toggle */}
            <div className="hidden md:flex items-center gap-1 border border-slate-300 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => onToggleLanguage("en")}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  language === "en"
                    ? "bg-white text-blue-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onToggleLanguage("hi")}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  language === "hi"
                    ? "bg-white text-blue-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>

        {/* Status / Provenance Banner */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <MapPin className="w-3 h-3 text-slate-400" />
              {selectedLocation
                ? `${selectedLocation.name}, ${selectedLocation.country}`
                : "No location chosen"}
            </span>
            {selectedLocation && (
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono text-[10px]">
                {selectedLocation.timezone}
              </span>
            )}
            {selectedScenario ? (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                <Sparkles className="w-3 h-3" />
                Synthetic Fixture: {selectedScenario}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                  stale
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                <Check className="w-3 h-3" />
                {stale ? "Cached Air (Stale)" : "CAMS Global Live Modelled"}
              </span>
            )}
          </div>

          <div className="text-slate-400 font-medium text-[11px]">
            Reference Guidance · Official Directives Independent
          </div>
        </div>
      </div>
    </header>
  );
}
