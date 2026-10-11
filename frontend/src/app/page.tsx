"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { ActionGuidance } from "../components/ActionGuidance";
import { VentilationCard } from "../components/VentilationCard";
import { ForecastChart } from "../components/ForecastChart";
import { ParentMessages } from "../components/ParentMessages";
import { GroundedChat } from "../components/GroundedChat";
import { fetchSchools, fetchBrief } from "../lib/api";
import { DailyCard, CardLocation, SchoolTemplate } from "../types/card";
import { Loader2, AlertCircle, RefreshCw, Sparkles, ExternalLink } from "lucide-react";

function ClearClassApp() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State initialized directly from URL parameters
  const [schools, setSchools] = useState<SchoolTemplate[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>(
    searchParams.get("school") || "delhi-demo"
  );
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

  // Initialize schools and URL params
  useEffect(() => {
    async function init() {
      try {
        const { schools: list } = await fetchSchools();
        setSchools(list);
        if (list.length > 0 && !selectedSchool) {
          setSelectedSchool(list[0].id);
        }
      } catch (err) {
        // fallback demo schools
        setSchools([
          { id: "delhi-demo", name: "Fictional Delhi School", defaultLocationId: 1273294 },
          { id: "bengaluru-demo", name: "Fictional Bengaluru School", defaultLocationId: 1277333 },
          { id: "london-demo", name: "Fictional London School", defaultLocationId: 2643743 },
        ]);
      }
    }
    init();

    // Read URL params
    const qScenario = searchParams.get("scenario");
    const qLang = searchParams.get("lang");
    const qSchool = searchParams.get("school");
    if (qScenario) setSelectedScenario(qScenario);
    if (qLang === "hi" || qLang === "en") setLanguage(qLang);
    if (qSchool) setSelectedSchool(qSchool);
  }, [searchParams]);

  // Load brief whenever school, location, scenario, or language changes
  const loadBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBrief(
        selectedSchool,
        selectedLocation?.id,
        selectedScenario || undefined,
        language
      );
      setCard(data);
      if (!selectedLocation && data.location) {
        setSelectedLocation(data.location);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load school brief";
      setError(message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSchool) {
      loadBrief();
    }
  }, [selectedSchool, selectedLocation?.id, selectedScenario, language]);

  // Sync URL params without full page reload
  const updateUrl = (locId?: number, scen?: string | null, sch?: string, lng?: string) => {
    const params = new URLSearchParams();
    if (sch) params.set("school", sch);
    if (locId) params.set("locationId", locId.toString());
    if (scen) params.set("scenario", scen);
    if (lng) params.set("lang", lng);
    router.replace(`/?${params.toString()}`);
  };

  const handleSelectLocation = (loc: CardLocation) => {
    setSelectedLocation(loc);
    updateUrl(loc.id, selectedScenario, selectedSchool, language);
  };

  const handleSelectSchool = (schoolId: string) => {
    setSelectedSchool(schoolId);
    // Reset location to school default when switching school
    setSelectedLocation(null);
    updateUrl(undefined, selectedScenario, schoolId, language);
  };

  const handleSelectScenario = (scen: string | null) => {
    setSelectedScenario(scen);
    updateUrl(selectedLocation?.id, scen, selectedSchool, language);
  };

  const handleToggleLanguage = (lng: "en" | "hi") => {
    setLanguage(lng);
    updateUrl(selectedLocation?.id, selectedScenario, selectedSchool, lng);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Header
        schools={schools}
        selectedSchool={selectedSchool}
        onSelectSchool={handleSelectSchool}
        selectedLocation={card?.location || selectedLocation}
        onSelectLocation={handleSelectLocation}
        selectedScenario={selectedScenario}
        onSelectScenario={handleSelectScenario}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        airStatus={card?.air?.status}
        stale={card?.air?.stale}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading && !card ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">
              {language === "hi"
                ? "मौसम, वायु और Cedar नीतियों का मूल्यांकन हो रहा है..."
                : "Evaluating forecasts, physical models, and Cedar policies..."}
            </p>
          </div>
        ) : error && !card ? (
          <div className="p-6 rounded-xl bg-white border border-rose-200 shadow-xs max-w-lg mx-auto text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === "hi" ? "डेटा लोड करने में त्रुटि" : "Error Loading Brief"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
            <button
              onClick={loadBrief}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900 text-white hover:bg-blue-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {language === "hi" ? "पुनः प्रयास करें" : "Retry"}
            </button>
          </div>
        ) : card ? (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Top Operational Action Headline */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                  {language === "hi" ? "दैनिक निर्णय सारांश" : "Today's Operational Stance"}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {card.scenarioId
                    ? `Scenario Preview: ${card.scenarioId}`
                    : `Active Brief for ${card.location.name} (${card.date})`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {card.regulatoryCoverage === "reference_only"
                    ? language === "hi"
                      ? "परियोजना संदर्भ मार्गदर्शन • स्थानीय आधिकारिक निर्देश अलग से सत्यापित करें"
                      : "Reference advisory adaptation • Verified local school directives not integrated"
                    : card.regulatoryCoverage}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {card.air.referenceAqi && (
                  <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Ref AQI
                    </span>
                    <span className="text-base font-bold font-mono text-slate-900 leading-none">
                      {card.air.referenceAqi.value}
                    </span>
                  </div>
                )}
                <button
                  onClick={loadBrief}
                  disabled={loading}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Refresh Brief"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-800" : ""}`} />
                </button>
              </div>
            </div>

            {/* 1. Action Guidance (Cohort cards + Why drawer) */}
            <ActionGuidance
              verdicts={card.verdicts}
              policySetVersion={card.policySetVersion}
              policySources={card.policySources}
              regulatoryCoverage={card.regulatoryCoverage}
              language={language}
            />

            {/* 2. Grounded Conversational Assistant (Strands + Nova Micro) */}
            <GroundedChat
              schoolId={selectedSchool}
              locationId={card.location.id}
              scenario={selectedScenario}
              language={language}
            />

            {/* 2. Comparative Ventilation Windows */}
            <VentilationCard ventilation={card.ventilation} language={language} />

            {/* 3. Hourly Forecast Chart with Shaded Flush Intervals */}
            <ForecastChart
              hourly={card.air.hourly}
              flushWindows={card.ventilation.flushWindows}
              timezone={card.location.timezone}
              language={language}
            />

            {/* 4. Ready-to-Copy Parent Messages */}
            <ParentMessages parentMessage={card.parentMessage} language={language} />
          </div>
        ) : null}
      </main>

      {/* Attribution Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-800">ClearClass · Bharat Builds Tour 2026</p>
              <p className="text-[11px] text-slate-500">
                Rules and physics decide; LLMs explain and converse. Not an official legal closure directive or medical guarantee.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-0.5 text-slate-600"
              >
                Open-Meteo & CAMS <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
              <span>·</span>
              <a
                href="https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf"
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-0.5 text-slate-600"
              >
                U.S. EPA AirNow <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
              <span>·</span>
              <a
                href="https://www.cedarpolicy.com"
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-0.5 text-slate-600"
              >
                Cedar Policy <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
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
