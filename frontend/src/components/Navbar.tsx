"use client";

import React from "react";
import {
  ClipboardList,
  Wind,
  MessageSquare,
  Bot,
  MapPin,
  ChevronDown,
  Sparkles,
  RefreshCw,
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
  { id: null, label: "Live Modelled Air", badge: "Live" },
  { id: "good-day", label: "Good Day (AQI 35)", badge: "Good" },
  { id: "moderate-day", label: "Moderate Day (AQI 75)", badge: "Moderate" },
  { id: "very-poor-day", label: "Very Poor Day (AQI 200)", badge: "Very Poor" },
  { id: "severe-day", label: "Severe Day (AQI 350)", badge: "Severe" },
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
  airStatus,
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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between min-h-16 py-2 gap-2 w-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  ClearClass
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                  School Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                {language === "hi"
                  ? "स्कूल वायु-गुणवत्ता निर्णय प्रणाली"
                  : "Decision Engine for Schools"}
              </p>
            </div>
          </div>

          {/* Center 4 Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-xs"
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
          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
            {/* Scenario Tester Pill */}
            <div className="relative">
              <select
                value={selectedScenario || ""}
                onChange={(e) => onSelectScenario(e.target.value ? e.target.value : null)}
                className="text-xs font-bold py-1.5 pl-2 pr-6 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 cursor-pointer transition-all max-w-[130px] sm:max-w-none truncate"
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
            <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg p-0.5">
              <button
                onClick={() => onToggleLanguage("en")}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                  language === "en"
                    ? "bg-white text-blue-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onToggleLanguage("hi")}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
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
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1.5 scrollbar-none">
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
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-bar: Location Status & Quick Change */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Location Pill & Change Button */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300/80 rounded-lg px-2.5 py-1 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span className="font-bold text-slate-900">
                {selectedLocation
                  ? `${selectedLocation.name}, ${selectedLocation.country}`
                  : language === "hi"
                  ? "कोई स्थान नहीं चुना गया"
                  : "Select a location"}
              </span>
              {selectedLocation && (
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  ({selectedLocation.timezone})
                </span>
              )}
              <button
                onClick={onOpenLocationModal}
                className="ml-1.5 pl-1.5 border-l border-slate-200 text-blue-800 hover:text-blue-950 font-bold hover:underline"
              >
                {language === "hi" ? "बदलें" : "Change"}
              </button>
            </div>

            {/* AQI & Air Status Badge */}
            {referenceAqi !== undefined && referenceAqi !== null && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-slate-300/80 rounded-lg px-2.5 py-1 text-slate-800 font-bold shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Ref AQI</span>
                <span className="font-mono text-blue-900">{referenceAqi}</span>
              </span>
            )}

            {selectedScenario ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 text-[11px]">
                <Sparkles className="w-3 h-3 text-amber-700" />
                {selectedScenario}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  stale
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                }`}
              >
                {stale ? "Cached Air (Stale)" : "CAMS Global Live"}
              </span>
            )}
          </div>

          {/* Right Action: Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
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
