"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
import { Button } from "@/components/ui/button";

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
  const [locationReady, setLocationReady] = useState(false);
  const latestBriefRequest = useRef(0);
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
        setLocationReady(true);
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
          setLocationReady(true);
          return;
        }
      }
    } catch {
      // ignore
    }
    setLocationReady(true);
  }, [searchParams]);

  // Load brief whenever location, scenario, or language changes
  const loadBrief = async () => {
    const request = ++latestBriefRequest.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBrief(
        DEFAULT_SCHOOL,
        selectedLocation?.id,
        selectedScenario || undefined,
        language
      );
      if (request !== latestBriefRequest.current) return;
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
      if (request !== latestBriefRequest.current) return;
      const message = err instanceof Error ? err.message : "Failed to load school brief";
      setError(message);
    } finally {
      if (request === latestBriefRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (locationReady) loadBrief();
  }, [locationReady, selectedLocation?.id, selectedScenario, language]);

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

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
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

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        {loading && !card ? (
          <div role="status" className="border-y bg-card py-12 text-center">
            <p className="text-base font-medium">
              {language === "hi" ? "आज की स्कूल सलाह तैयार की जा रही है" : "Preparing today's school brief"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === "hi" ? "पूर्वानुमान और Cedar नीतियों की जाँच जारी है।" : "Checking the forecast and Cedar policies."}
            </p>
          </div>
        ) : error && !card ? (
          <section role="alert" className="border-y bg-card py-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-deny-foreground" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-semibold">{language === "hi" ? "स्कूल की सलाह लोड नहीं हो सकी" : "School brief could not be loaded"}</h1>
                <p className="mt-1 break-words text-sm text-muted-foreground">{error}</p>
                <Button onClick={loadBrief} className="mt-5 gap-2 shadow-none">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {language === "hi" ? "पुनः प्रयास करें" : "Retry"}
                </Button>
              </div>
            </div>
          </section>
        ) : card ? (
          <div className="space-y-5">
            {/* The 2-Second Decision Hero (Always Visible on Activity Tab, Compact on others) */}
            <DecisionHero
              verdicts={card.verdicts}
              referenceAqi={card.air.referenceAqi}
              locationName={card.location.name}
              selectedCohort={selectedCohort}
              onSelectCohort={setSelectedCohort}
              language={language}
              scenarioId={card.scenarioId}
              compact={activeTab !== "activity"}
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

      <footer className="mt-10 border-t bg-card py-5 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:px-6">
          <p className="font-medium text-foreground">ClearClass · Bharat Builds Tour 2026 (Track 01 Air)</p>
          <p>Rules and physics decide; Amazon Bedrock explains and converses. Project reference advisory adaptation.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a className="underline-offset-4 hover:text-primary hover:underline" href="https://open-meteo.com" target="_blank" rel="noreferrer">CAMS Global Forecast <ExternalLink className="inline h-3.5 w-3.5" aria-hidden="true" /></a>
            <a className="underline-offset-4 hover:text-primary hover:underline" href="https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf" target="_blank" rel="noreferrer">EPA AirNow Guidance <ExternalLink className="inline h-3.5 w-3.5" aria-hidden="true" /></a>
            <a className="underline-offset-4 hover:text-primary hover:underline" href="https://www.cedarpolicy.com" target="_blank" rel="noreferrer">Cedar Policy <ExternalLink className="inline h-3.5 w-3.5" aria-hidden="true" /></a>
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
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">
          Preparing school brief…
        </div>
      }
    >
      <ClearClassApp />
    </Suspense>
  );
}
