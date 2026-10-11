"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Users,
  HeartPulse,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Verdict, ReferenceAqi } from "../types/card";

interface DecisionHeroProps {
  verdicts: Verdict[];
  referenceAqi?: ReferenceAqi | null;
  locationName: string;
  selectedCohort: "all_students" | "sensitive_pupils";
  onSelectCohort: (cohort: "all_students" | "sensitive_pupils") => void;
  language: "en" | "hi";
  scenarioId?: string | null;
}

export function DecisionHero({
  verdicts,
  referenceAqi,
  locationName,
  selectedCohort,
  onSelectCohort,
  language,
  scenarioId,
}: DecisionHeroProps) {
  const cohortVerdicts = verdicts.filter((v) => v.cohort === selectedCohort);

  const hasDenyOrWithheld = cohortVerdicts.some(
    (v) => v.decision === "deny" || v.status !== "evaluated"
  );
  const hasModify = cohortVerdicts.some((v) => v.decision === "modify");

  let severity: "allow" | "modify" | "deny" = "allow";
  if (hasDenyOrWithheld) {
    severity = "deny";
  } else if (hasModify) {
    severity = "modify";
  }

  const aqiVal = referenceAqi?.value ?? 0;
  const spectrumPercent = Math.min(100, Math.max(0, (aqiVal / 500) * 100));

  // AQI Category
  const getAqiCategory = (val: number) => {
    if (val <= 50) {
      return {
        label: language === "hi" ? "अच्छा (Good)" : "Good Air",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }
    if (val <= 100) {
      return {
        label: language === "hi" ? "मध्यम (Moderate)" : "Moderate Air",
        color: "text-blue-700 bg-blue-50 border-blue-200",
      };
    }
    if (val <= 150) {
      return {
        label: language === "hi" ? "संवेदनशील वर्ग हेतु अस्वस्थ" : "Unhealthy for Sensitive",
        color: "text-amber-800 bg-amber-50 border-amber-200",
      };
    }
    if (val <= 200) {
      return {
        label: language === "hi" ? "अस्वस्थ (Unhealthy)" : "Unhealthy Air",
        color: "text-orange-800 bg-orange-50 border-orange-200",
      };
    }
    if (val <= 300) {
      return {
        label: language === "hi" ? "अत्यंत अस्वस्थ (Very Unhealthy)" : "Very Unhealthy",
        color: "text-purple-800 bg-purple-50 border-purple-200",
      };
    }
    return {
      label: language === "hi" ? "गंभीर / खतरनाक (Hazardous)" : "Hazardous Air",
      color: "text-rose-800 bg-rose-50 border-rose-200",
    };
  };

  const aqiCategory = getAqiCategory(aqiVal);

  const getActivityVerdict = (actName: string) => {
    const v = cohortVerdicts.find((item) => item.activity === actName);
    if (!v) return { text: "No Data", badge: "bg-slate-100 text-slate-700 border-slate-200" };
    if (v.status !== "evaluated") {
      return {
        text: language === "hi" ? "अनुपलब्ध" : "Withheld",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }
    if (v.decision === "allow") {
      return {
        text: language === "hi" ? "अनुमति" : "Proceed",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    if (v.decision === "modify") {
      if (v.selectedAction === "indoor_relocation_or_reschedule") {
        return {
          text: language === "hi" ? "भीतर कराएं" : "Move Indoors",
          badge: "bg-rose-50 text-rose-800 border-rose-200",
        };
      }
      return {
        text: language === "hi" ? "संशोधित करें" : "Modify / Breaks",
        badge: "bg-amber-50 text-amber-900 border-amber-200",
      };
    }
    return {
      text: language === "hi" ? "अस्वीकृत" : "Move Indoors",
      badge: "bg-rose-50 text-rose-800 border-rose-200",
    };
  };

  const assembly = getActivityVerdict("assembly");
  const pe = getActivityVerdict("pe");
  const recess = getActivityVerdict("recess");
  const sports = getActivityVerdict("sports");

  return (
    <section
      className={`rounded-2xl border shadow-card overflow-hidden transition-all bg-white ${
        severity === "allow"
          ? "border-t-4 border-t-emerald-500 border-slate-200/80"
          : severity === "modify"
          ? "border-t-4 border-t-amber-500 border-slate-200/80"
          : "border-t-4 border-t-rose-500 border-slate-200/80"
      }`}
    >
      {/* Top Section: Stance Headline & Digital AQI Gauge */}
      <div className="p-6 sm:p-7 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Action Stance Headline */}
          <div className="flex items-start gap-4 max-w-3xl">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ring-1 ring-black/5 ${
                severity === "allow"
                  ? "bg-emerald-50 text-emerald-700"
                  : severity === "modify"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {severity === "allow" ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : severity === "modify" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>

            <div>
              {/* Pulsing Pill */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/80">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        severity === "allow"
                          ? "bg-emerald-400"
                          : severity === "modify"
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        severity === "allow"
                          ? "bg-emerald-500"
                          : severity === "modify"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                  </span>
                  <span>
                    {severity === "allow"
                      ? language === "hi" ? "सुरक्षित / अनुमति" : "Safe to Proceed"
                      : severity === "modify"
                      ? language === "hi" ? "सावधानी / संशोधन आवश्यक" : "Caution / Modify"
                      : language === "hi" ? "चेतावनी / गतिविधि भीतर करें" : "Alert / Relocate Indoors"}
                  </span>
                </span>

                {scenarioId && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-mono">
                    Scenario: {scenarioId}
                  </span>
                )}
              </div>

              {/* Huge Headline */}
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1.5">
                {severity === "allow"
                  ? language === "hi"
                    ? "आज बाहरी गतिविधियाँ सामान्य रूप से जारी रख सकते हैं"
                    : "Outdoor Activities Permitted Today"
                  : severity === "modify"
                  ? language === "hi"
                    ? "बाहरी गतिविधियों की तीव्रता कम करें और अधिक विराम दें"
                    : "Modify Outdoor Activities Today"
                  : language === "hi"
                  ? "सभी गतिविधियाँ स्कूल के भीतर कराएं"
                  : "Relocate Outdoor Activities Indoors"}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 font-normal mt-1.5 leading-relaxed">
                {severity === "allow"
                  ? language === "hi"
                    ? `वायु गुणवत्ता अनुकूल है (AQI ${aqiVal})। सुबह की प्रार्थना सभा, पीई और खेलकूद सामान्य रूप से हो सकते हैं।`
                    : `Air quality is favorable (Ref AQI ${aqiVal}). Morning assembly, PE, recess, and sports can proceed normally.`
                  : severity === "modify"
                  ? language === "hi"
                    ? `कण प्रदूषण बढ़ा हुआ है (AQI ${aqiVal})। लंबी गतिविधियों की गति धीमी करें और प्रतिस्पर्धी खेल भीतर कराएं।`
                    : `Elevated particulate pollution (Ref AQI ${aqiVal}). Reduce physical intensity, increase rest breaks, and move competitive sports indoors.`
                  : language === "hi"
                  ? `गंभीर प्रदूषण (AQI ${aqiVal})। बाहरी संपर्क सीमित करें; सभा और खेलकूद केवल उचित वेंटिलेशन वाले कमरों में कराएं।`
                  : `Hazardous air conditions (Ref AQI ${aqiVal}). Avoid outdoor exposure; move assembly and PE indoors with monitored ventilation.`}
              </p>
            </div>
          </div>

          {/* Digital AQI Card with Mini-Spectrum Gauge */}
          {referenceAqi && (
            <div className="bg-slate-900 text-white p-4 sm:p-4.5 rounded-2xl shadow-xs shrink-0 w-full sm:w-60 border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                <span>Modelled Ref AQI</span>
                <span className="text-slate-500">U.S. EPA</span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-4xl font-extrabold font-mono tracking-tight text-white leading-none">
                  {aqiVal}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${aqiCategory.color}`}>
                  {aqiCategory.label}
                </span>
              </div>

              {/* 5-Color Spectrum Mini Bar with Needle */}
              <div className="mt-3 pt-2.5 border-t border-slate-800">
                <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 via-purple-600 to-rose-700" />
                <div className="relative w-full h-2 mt-0.5">
                  <div
                    className="absolute top-0 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-white transition-all duration-300"
                    style={{ left: `${spectrumPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                  <span>0</span>
                  <span>100</span>
                  <span>200</span>
                  <span>300</span>
                  <span>500</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cohort Segmented Control & 4 Instant Activity Pills */}
      <div className="p-5 sm:p-6 bg-slate-50/40">
        {/* Cohort Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => onSelectCohort("all_students")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCohort === "all_students"
                  ? "bg-white text-slate-900 shadow-xs ring-1 ring-black/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-900" />
              <span>{language === "hi" ? "सभी विद्यार्थी (All Students)" : "All Students"}</span>
            </button>
            <button
              onClick={() => onSelectCohort("sensitive_pupils")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCohort === "sensitive_pupils"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "संवेदनशील / अस्थमा विद्यार्थी" : "Sensitive & Asthma Pupils"}</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            {language === "hi"
              ? "U.S. EPA AirNow दिशानिर्देशों पर आधारित Cedar नीति"
              : "Decisions evaluated via Cedar policy on EPA AirNow guidance"}
          </span>
        </div>

        {/* 4 Instant Action Pills Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Assembly */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-card flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                {language === "hi" ? "प्रार्थना सभा" : "Assembly"}
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {language === "hi" ? "सुबह की सभा" : "Morning Assembly"}
              </span>
            </div>
            <span
              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${assembly.badge}`}
            >
              {assembly.text}
            </span>
          </div>

          {/* Physical Education */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-card flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                {language === "hi" ? "शारीरिक शिक्षा" : "Physical Ed"}
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                PE Class
              </span>
            </div>
            <span
              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${pe.badge}`}
            >
              {pe.text}
            </span>
          </div>

          {/* Outdoor Recess */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-card flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                {language === "hi" ? "मध्यांतर खेल" : "Recess"}
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {language === "hi" ? "बाहरी अवकाश" : "Outdoor Recess"}
              </span>
            </div>
            <span
              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${recess.badge}`}
            >
              {recess.text}
            </span>
          </div>

          {/* Competitive Sports */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-card flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                {language === "hi" ? "तीव्र खेलकूद" : "Athletics"}
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {language === "hi" ? "प्रतियोगी खेल" : "Intense Sports"}
              </span>
            </div>
            <span
              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${sports.badge}`}
            >
              {sports.text}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
