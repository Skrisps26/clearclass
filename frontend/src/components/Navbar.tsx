"use client";

import { MapPin, RefreshCw } from "lucide-react";
import { CardLocation } from "../types/card";
import { Button } from "@/components/ui/button";
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
  { id: "live", label: "Live forecast" },
  { id: "good-day", label: "Good day · 35" },
  { id: "moderate-day", label: "Moderate · 75" },
  { id: "very-poor-day", label: "Very poor · 200" },
  { id: "severe-day", label: "Severe · 350" },
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
  const tabs: { id: NavTab; en: string; hi: string; shortEn: string; shortHi: string }[] = [
    { id: "activity", en: "Activity advice", hi: "गतिविधि सलाह", shortEn: "Activity", shortHi: "गतिविधि" },
    { id: "ventilation", en: "Classroom airing", hi: "कक्षा वेंटिलेशन", shortEn: "Ventilation", shortHi: "वेंटिलेशन" },
    { id: "parents", en: "Parent notices", hi: "अभिभावक नोटिस", shortEn: "Notices", shortHi: "नोटिस" },
    { id: "assistant", en: "Assistant", hi: "सहायक", shortEn: "Assistant", shortHi: "सहायक" },
  ];
  const provenance = airStatus === "unavailable"
    ? "Forecast unavailable"
    : stale || airStatus === "cached_stale"
      ? "Stale forecast"
      : selectedScenario || airStatus === "synthetic"
        ? "Demo scenario"
        : airStatus === "cached"
          ? "Cached forecast"
          : airStatus === "modelled"
            ? "Model forecast"
            : "Forecast status unknown";

  return (
    <header className="border-b bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
          <div className="min-w-0">
            <div className="text-[19px] font-semibold leading-tight tracking-tight">ClearClass</div>
            <p className="text-sm text-muted-foreground">
              {language === "hi" ? "स्कूल के लिए दैनिक निर्णय" : "School day decisions"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1" aria-label="Language">
            <Button variant={language === "en" ? "secondary" : "ghost"} size="sm" onClick={() => onToggleLanguage("en")}
              aria-pressed={language === "en"} className="h-9 px-2.5 text-sm shadow-none">EN</Button>
            <Button variant={language === "hi" ? "secondary" : "ghost"} size="sm" onClick={() => onToggleLanguage("hi")}
              aria-pressed={language === "hi"} className="h-9 px-2.5 text-sm shadow-none">हिन्दी</Button>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 pb-2 sm:pb-3">
          <Button variant="outline" size="sm" onClick={onOpenLocationModal}
            className="h-9 min-w-0 max-w-[48%] flex-1 justify-start gap-1.5 px-2.5 text-sm font-medium shadow-none sm:max-w-none sm:flex-none">
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{selectedLocation?.name || (language === "hi" ? "स्थान चुनें" : "Choose location")}</span>
            <span className="sr-only">{language === "hi" ? "स्थान बदलें" : "Change location"}</span>
          </Button>
          <span className="sr-only" id="scenario-label">Scenario</span>
          <Select value={selectedScenario || "live"} onValueChange={(val) => onSelectScenario(val === "live" ? null : val)}>
            <SelectTrigger aria-labelledby="scenario-label" className="h-9 min-w-0 flex-1 text-sm shadow-none sm:max-w-56 sm:flex-none">
              <SelectValue placeholder="Scenario" />
            </SelectTrigger>
            <SelectContent>
              {SCENARIOS.map((sc) => <SelectItem key={sc.id} value={sc.id}>{sc.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {onRefresh && <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}
            aria-label={language === "hi" ? "ताज़ा करें" : "Refresh brief"} className="h-9 shrink-0 gap-2 px-2.5 text-sm shadow-none sm:px-3">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            <span className="hidden sm:inline">{language === "hi" ? "ताज़ा करें" : "Refresh"}</span>
          </Button>}
        </div>
        <div className="overflow-x-auto" aria-label="Decision sections">
          <Tabs value={activeTab} onValueChange={(val) => onSelectTab(val as NavTab)}>
            <TabsList className="h-auto w-max min-w-full justify-start gap-4 rounded-none bg-transparent p-0 sm:gap-7">
              {tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}
                aria-label={language === "hi" ? tab.hi : tab.en}
                className="min-h-10 shrink-0 rounded-none border-b-2 border-transparent px-0.5 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
                <span className="sm:hidden">{language === "hi" ? tab.shortHi : tab.shortEn}</span>
                <span className="hidden sm:inline">{language === "hi" ? tab.hi : tab.en}</span>
              </TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="border-t bg-background/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 px-4 py-1.5 text-sm text-muted-foreground sm:px-6">
          <span>{provenance}</span>
          {referenceAqi != null && <><span aria-hidden="true">·</span><span>Reference AQI <span className="font-mono tabular-nums text-foreground">{referenceAqi}</span></span></>}
        </div>
      </div>
    </header>
  );
}
