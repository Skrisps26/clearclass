"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar, NavTab } from "../components/Navbar";
import { DecisionHero } from "../components/DecisionHero";
import { LocationModal } from "../components/LocationModal";
import { ActivityTab } from "../components/ActivityTab";
import { VentilationTab } from "../components/VentilationTab";
import { ParentNoticeTab } from "../components/ParentNoticeTab";
import { AssistantTab } from "../components/AssistantTab";
import { fetchBrief } from "../lib/api";
import { DailyCard, CardLocation } from "../types/card";
import { Loader2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

const DEFAULT_SCHOOL = "delhi-demo";

function ClearClassApp() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active tab state (synced with ?tab=...)
  const validTabs: NavTab[] = ["activity", "ventilation", "parents", "assistant"];
  const initialTab = searchParams.get("tab") as NavTab;
  const [activeTab, setActiveTab] = useState<NavTab>(
    validTabs.includes(initialTab) ? initialTab : "activity"
  );

  // Cohort state
  const [selectedCohort, setSelectedCohort] = useState<"all_students" | "sensitive_pupils">(
    "all_students"
  );

  // Location modal state
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // App state
  const [selectedLocation, setSelectedLocation] = useState<CardLocation | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(
    searchParams.get("scenario")
  );
  const [language, setLanguage] = useState<"en" | "hi">(
    searchParams.get("lang") === "hi" ? "hi" : "en"
  );

  const [card, setCard] = useState<DailyCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial location from URL param, localStorage, or default
  useEffect(() => {
    const qLocationId = searchParams.get("locationId");
    if (qLocationId) {
      const locIdNum = parseInt(qLocationId, 10);
      if (!isNaN(locIdNum) && locIdNum > 0) {
        setSelectedLocation({
          id: locIdNum,
          name: searchParams.get("locationName") || "Selected City",
          country: "",
          timezone: "",
          coordinates: { latitude: 0, longitude: 0 },
        });
        return;
      }
    }
    // Check localStorage
    try {
      const saved = localStorage.getItem("clearclass_saved_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && "id" in parsed) {
          setSelectedLocation(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
  }, [searchParams]);

  // Load brief whenever location, scenario, or language changes
  const loadBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBrief(
        DEFAULT_SCHOOL,
        selectedLocation?.id,
        selectedScenario || undefined,
        language
      );
      setCard(data);
      if (data.location) {
        setSelectedLocation(data.location);
        try {
          localStorage.setItem("clearclass_saved_location", JSON.stringify(data.location));
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load school brief";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrief();
  }, [selectedLocation?.id, selectedScenario, language]);

  // Sync URL search params
  const updateUrl = (
    tab: NavTab,
    locId?: number,
    locName?: string,
    scen?: string | null,
    lng?: string
  ) => {
    const params = new URLSearchParams();
    if (tab !== "activity") params.set("tab", tab);
    if (locId) params.set("locationId", locId.toString());
    if (locName) params.set("locationName", locName);
    if (scen) params.set("scenario", scen);
    if (lng && lng !== "en") params.set("lang", lng);
    const queryString = params.toString();
    router.replace(queryString ? `/?${queryString}` : "/");
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    updateUrl(tab, selectedLocation?.id, selectedLocation?.name, selectedScenario, language);
  };

  const handleSelectLocation = (loc: CardLocation) => {
    setSelectedLocation(loc);
    updateUrl(activeTab, loc.id, loc.name, selectedScenario, language);
  };

  const handleSelectScenario = (scen: string | null) => {
    setSelectedScenario(scen);
    updateUrl(activeTab, selectedLocation?.id, selectedLocation?.name, scen, language);
  };

  const handleToggleLanguage = (lng: "en" | "hi") => {
    setLanguage(lng);
    updateUrl(activeTab, selectedLocation?.id, selectedLocation?.name, selectedScenario, lng);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* Location Modal */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelectLocation={handleSelectLocation}
        currentLocation={card?.location || selectedLocation}
        language={language}
      />

      {/* Top Navbar with 4 Tabs & Location Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        selectedLocation={card?.location || selectedLocation}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        selectedScenario={selectedScenario}
        onSelectScenario={handleSelectScenario}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        referenceAqi={card?.air?.referenceAqi?.value}
        airStatus={card?.air?.status}
        stale={card?.air?.stale}
        onRefresh={loadBrief}
        loading={loading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading && !card ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
            <p className="text-xs font-bold text-slate-600">
              {language === "hi"
                ? "मौसम, वायु और Cedar नीतियों का मूल्यांकन हो रहा है..."
                : "Evaluating forecasts, physical models, and Cedar policies..."}
            </p>
          </div>
        ) : error && !card ? (
          <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-xs max-w-md mx-auto text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === "hi" ? "डेटा लोड करने में त्रुटि" : "Error Loading Brief"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">{error}</p>
            </div>
            <button
              onClick={loadBrief}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "पुनः प्रयास करें" : "Retry"}</span>
            </button>
          </div>
        ) : card ? (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* The 2-Second Decision Hero (Always Visible on Activity Tab, Compact on others) */}
            <DecisionHero
              verdicts={card.verdicts}
              referenceAqi={card.air.referenceAqi}
              locationName={card.location.name}
              selectedCohort={selectedCohort}
              onSelectCohort={setSelectedCohort}
              language={language}
              scenarioId={card.scenarioId}
            />

            {/* Tab 1: Activity Advice */}
            {activeTab === "activity" && (
              <ActivityTab
                verdicts={card.verdicts}
                selectedCohort={selectedCohort}
                policySetVersion={card.policySetVersion}
                policySources={card.policySources}
                regulatoryCoverage={card.regulatoryCoverage}
                language={language}
              />
            )}

            {/* Tab 2: Classroom Airing */}
            {activeTab === "ventilation" && (
              <VentilationTab
                ventilation={card.ventilation}
                hourly={card.air.hourly}
                timezone={card.location.timezone}
                language={language}
              />
            )}

            {/* Tab 3: Parent Notices */}
            {activeTab === "parents" && (
              <ParentNoticeTab
                parentMessage={card.parentMessage}
                language={language}
                locationName={card.location.name}
              />
            )}

            {/* Tab 4: AI Assistant */}
            {activeTab === "assistant" && (
              <AssistantTab
                schoolId={DEFAULT_SCHOOL}
                locationId={card.location.id}
                scenario={card.scenarioId}
                language={language}
                locationName={card.location.name}
              />
            )}
          </div>
        ) : null}
      </main>

      {/* Clean Attribution Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-800">ClearClass · Bharat Builds Tour 2026 (Track 01 Air)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Rules and physics decide; Amazon Bedrock explains and converses. Project reference advisory adaptation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1 text-slate-600 hover:text-slate-900"
              >
                <span>CAMS Global Forecast</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
              <span>·</span>
              <a
                href="https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf"
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1 text-slate-600 hover:text-slate-900"
              >
                <span>EPA AirNow Guidance</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
              <span>·</span>
              <a
                href="https://www.cedarpolicy.com"
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1 text-slate-600 hover:text-slate-900"
              >
                <span>Cedar Policy</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
        </div>
      }
    >
      <ClearClassApp />
    </Suspense>
  );
}
