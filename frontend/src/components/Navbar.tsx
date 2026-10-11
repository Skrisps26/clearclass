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
} from "lucide-react";
import { CardLocation } from "../types/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  { id: "live", label: "Live Modelled Air" },
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
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/90 border-b border-border shadow-xs transition-all">
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between min-h-16 py-2.5 gap-3 w-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-base shadow-xs ring-1 ring-black/5">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-foreground leading-none">
                  ClearClass
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0">
                  Engine
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium hidden sm:block mt-0.5">
                {language === "hi"
                  ? "स्कूल वायु-गुणवत्ता निर्णय प्रणाली"
                  : "Decision Engine for Schools"}
              </p>
            </div>
          </div>

          {/* Center 4 Navigation Tabs using shadcn Tabs */}
          <div className="hidden md:flex items-center">
            <Tabs value={activeTab} onValueChange={(val) => onSelectTab(val as NavTab)}>
              <TabsList className="bg-muted p-1 rounded-xl">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* Right Controls: Scenario Tester & Language */}
          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            {/* Scenario Tester using shadcn Select */}
            <div className="w-40 sm:w-48">
              <Select
                value={selectedScenario || "live"}
                onValueChange={(val) => onSelectScenario(val === "live" ? null : val)}
              >
                <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                  <SelectValue placeholder="Scenario" />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIOS.map((sc) => (
                    <SelectItem key={sc.id} value={sc.id} className="text-xs">
                      {sc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Toggle using shadcn Button */}
            <div className="flex items-center bg-muted border border-border rounded-lg p-0.5 shadow-2xs">
              <Button
                variant={language === "en" ? "default" : "ghost"}
                size="sm"
                onClick={() => onToggleLanguage("en")}
                className="h-7 px-2.5 text-xs font-bold rounded-md"
              >
                EN
              </Button>
              <Button
                variant={language === "hi" ? "default" : "ghost"}
                size="sm"
                onClick={() => onToggleLanguage("hi")}
                className="h-7 px-2.5 text-xs font-bold rounded-md"
              >
                हिन्दी
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-border gap-1.5 scrollbar-none w-full">
          <Tabs value={activeTab} onValueChange={(val) => onSelectTab(val as NavTab)} className="w-full">
            <TabsList className="w-full flex justify-start overflow-x-auto h-auto p-1 bg-muted">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold whitespace-nowrap"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Sub-bar: Location Status & Interactive Switcher */}
      <div className="bg-muted/40 border-t border-border/60 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Location Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLocationModal}
              className="h-7 px-2.5 text-xs font-bold bg-background flex items-center gap-1.5 shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>
                {selectedLocation
                  ? `${selectedLocation.name}, ${selectedLocation.country}`
                  : language === "hi"
                  ? "स्थान चुनें"
                  : "Choose location"}
              </span>
              <span className="text-[11px] font-semibold text-blue-800 ml-1 underline">
                {language === "hi" ? "बदलें" : "Change"}
              </span>
            </Button>

            {/* AQI Badge */}
            {referenceAqi !== undefined && referenceAqi !== null && (
              <Badge variant="outline" className="h-7 px-2.5 text-xs font-bold bg-background gap-1.5 shadow-2xs">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">AQI</span>
                <span className="font-mono text-blue-900 font-extrabold">{referenceAqi}</span>
              </Badge>
            )}

            {/* Model Provenance Badge with Pulsing Dot */}
            {selectedScenario ? (
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Scenario: {selectedScenario}</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={`gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold ${
                  stale
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-emerald-50 text-emerald-900 border-emerald-200"
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
              </Badge>
            )}
          </div>

          {/* Right Action: Refresh button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-7 px-2.5 text-[11px] font-semibold bg-background shadow-2xs gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>{language === "hi" ? "ताज़ा करें" : "Refresh"}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
