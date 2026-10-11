"use client";

import React from "react";
import {
  ClipboardList,
  Wind,
  MessageSquare,
  Bot,
  MapPin,
  Sparkles,
  RefreshCw,
  Compass,
} from "lucide-react";
import { CardLocation } from "../types/card";

export type NavTab = "activity" | "ventilation" | "parents" | "assistant";

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedLocation: CardLocation | null;
  onOpenLocationModal: () => void;
  selectedScenario: string | null;
  onSelectScenario: (scenario: string | null) => void;
  language: "en" | "hi";
  onToggleLanguage: (lang: "en" | "hi") => void;
  referenceAqi?: number | null;
  airStatus?: string;
  stale?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
}

const SCENARIOS = [
  { id: null, label: "Live Modelled Air" },
  { id: "good-day", label: "Good Day (AQI 35)" },
  { id: "moderate-day", label: "Moderate Day (AQI 75)" },
  { id: "very-poor-day", label: "Very Poor Day (AQI 200)" },
  { id: "severe-day", label: "Severe Day (AQI 350)" },
];

export function Navbar({
  activeTab,
  onSelectTab,
  selectedLocation,
  onOpenLocationModal,
  selectedScenario,
  onSelectScenario,
  language,
  onToggleLanguage,
  referenceAqi,
  stale,
  onRefresh,
  loading,
}: NavbarProps) {
  const tabs = [
    {
      id: "activity" as NavTab,
      label: language === "hi" ? "गतिविधि सलाह" : "Activity Advice",
      icon: ClipboardList,
    },
    {
      id: "ventilation" as NavTab,
      label: language === "hi" ? "कक्षा वेंटिलेशन" : "Classroom Airing",
      icon: Wind,
    },
    {
      id: "parents" as NavTab,
      label: language === "hi" ? "अभिभावक नोटिस" : "Parent Notices",
      icon: MessageSquare,
    },
    {
      id: "assistant" as NavTab,
      label: language === "hi" ? "AI सहायक" : "AI Assistant",
      icon: Bot,
    },
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/90 border-b border-slate-200/80 transition-all">
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between min-h-16 py-2.5 gap-3 w-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white flex items-center justify-center font-black text-base shadow-xs ring-1 ring-black/5">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                  ClearClass
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200/70 font-mono">
                  Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                {language === "hi"
                  ? "स्कूल वायु-गुणवत्ता निर्णय प्रणाली"
                  : "Location-Agnostic Decision Engine for Schools"}
              </p>
            </div>
          </div>

          {/* Center 4 Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-2xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs ring-1 ring-black/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-900" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Scenario Tester & Language */}
          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            {/* Scenario Tester Pill */}
            <div className="relative">
              <select
                value={selectedScenario || ""}
                onChange={(e) => onSelectScenario(e.target.value ? e.target.value : null)}
                className="text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-lg border border-slate-200 bg-slate-50/80 text-slate-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/15 cursor-pointer transition-all max-w-[140px] sm:max-w-none truncate shadow-2xs"
                title="Switch test scenario to observe instant rule updates"
              >
                {SCENARIOS.map((sc) => (
                  <option key={sc.id || "live"} value={sc.id || ""}>
                    {sc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center bg-slate-100/90 border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => onToggleLanguage("en")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  language === "en"
                    ? "bg-white text-blue-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onToggleLanguage("hi")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  language === "hi"
                    ? "bg-white text-blue-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs (visible on small screens) */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1.5 scrollbar-none w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-blue-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-bar: Location Status & Interactive Switcher */}
      <div className="bg-slate-50/70 border-t border-slate-200/60 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Location Pill */}
            <button
              onClick={onOpenLocationModal}
              className="group inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-900">
                {selectedLocation
                  ? `${selectedLocation.name}, ${selectedLocation.country}`
                  : language === "hi"
                  ? "स्थान चुनें"
                  : "Choose location"}
              </span>
              <span className="text-[11px] font-semibold text-blue-800 ml-1 group-hover:underline">
                {language === "hi" ? "बदलें" : "Change"}
              </span>
            </button>

            {/* AQI Badge */}
            {referenceAqi !== undefined && referenceAqi !== null && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-800 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">AQI</span>
                <span className="font-mono text-blue-900 font-extrabold">{referenceAqi}</span>
              </span>
            )}

            {/* Model Provenance Badge with Pulsing Dot */}
            {selectedScenario ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Scenario: {selectedScenario}</span>
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                  stale
                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                    : "bg-emerald-50 text-emerald-900 border border-emerald-200"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      stale ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      stale ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                </span>
                <span>{stale ? "Cached Air (Stale)" : "Live CAMS Global Forecast"}</span>
              </span>
            )}
          </div>

          {/* Right Action: Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-blue-900" : ""}`} />
              <span>{language === "hi" ? "ताज़ा करें" : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
