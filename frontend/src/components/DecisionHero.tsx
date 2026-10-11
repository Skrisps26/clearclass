"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Users,
  HeartPulse,
  Flame,
  Award,
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
  // Filter verdicts for active cohort
  const cohortVerdicts = verdicts.filter((v) => v.cohort === selectedCohort);

  // Compute overall posture
  const hasDenyOrWithheld = cohortVerdicts.some(
    (v) => v.decision === "deny" || v.status !== "evaluated"
  );
  const hasModify = cohortVerdicts.some((v) => v.decision === "modify");

  // Determine overall severity
  let severity: "allow" | "modify" | "deny" = "allow";
  if (hasDenyOrWithheld) {
    severity = "deny";
  } else if (hasModify) {
    severity = "modify";
  }

  const aqiVal = referenceAqi?.value ?? 0;

  // AQI Category Plain Language
  const getAqiCategory = (val: number) => {
    if (val <= 50) return { label: language === "hi" ? "अच्छा (Good)" : "Good Air", color: "text-emerald-700 bg-emerald-100" };
    if (val <= 100) return { label: language === "hi" ? "मध्यम (Moderate)" : "Moderate Air", color: "text-blue-700 bg-blue-100" };
    if (val <= 150) return { label: language === "hi" ? "संवेदनशील वर्ग हेतु अस्वस्थ" : "Unhealthy for Sensitive", color: "text-amber-700 bg-amber-100" };
    if (val <= 200) return { label: language === "hi" ? "अस्वस्थ (Unhealthy)" : "Unhealthy Air", color: "text-orange-700 bg-orange-100" };
    if (val <= 300) return { label: language === "hi" ? "अत्यंत अस्वस्थ (Very Unhealthy)" : "Very Unhealthy", color: "text-purple-700 bg-purple-100" };
    return { label: language === "hi" ? "गंभीर / खतरनाक (Hazardous)" : "Hazardous Air", color: "text-rose-700 bg-rose-100" };
  };

  const aqiCategory = getAqiCategory(aqiVal);

  // Activity shortcut helper
  const getActivityVerdict = (actName: string) => {
    const v = cohortVerdicts.find((item) => item.activity === actName);
    if (!v) return { text: "No Data", badge: "bg-slate-100 text-slate-700" };
    if (v.status !== "evaluated") {
      return {
        text: language === "hi" ? "अनुपलब्ध" : "Withheld",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }
    if (v.decision === "allow") {
      return {
        text: language === "hi" ? "अनुमति" : "Proceed",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      };
    }
    if (v.decision === "modify") {
      if (v.selectedAction === "indoor_relocation_or_reschedule") {
        return {
          text: language === "hi" ? "भीतर कराएं" : "Move Indoors",
          badge: "bg-rose-100 text-rose-800 border-rose-300",
        };
      }
      return {
        text: language === "hi" ? "संशोधित करें" : "Modify / Breaks",
        badge: "bg-amber-100 text-amber-800 border-amber-300",
      };
    }
    return {
      text: language === "hi" ? "अस्वीकृत" : "Move Indoors",
      badge: "bg-rose-100 text-rose-800 border-rose-300",
    };
  };

  const assembly = getActivityVerdict("assembly");
  const pe = getActivityVerdict("pe");
  const recess = getActivityVerdict("recess");
  const sports = getActivityVerdict("sports");

  return (
    <section className="rounded-2xl border shadow-sm overflow-hidden transition-all bg-white">
      {/* Top Banner with dynamic severity */}
      <div
        className={`p-5 sm:p-6 border-b transition-colors ${
          severity === "allow"
            ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
            : severity === "modify"
            ? "bg-amber-50/90 border-amber-200 text-amber-950"
            : "bg-rose-50/90 border-rose-200 text-rose-950"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Main Action Stance Headline */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                severity === "allow"
                  ? "bg-emerald-600 text-white"
                  : severity === "modify"
                  ? "bg-amber-500 text-white"
                  : "bg-rose-600 text-white"
              }`}
            >
              {severity === "allow" ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : severity === "modify" ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <ShieldAlert className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-black/10">
                  {severity === "allow"
                    ? language === "hi" ? "सुरक्षित / अनुमति" : "Safe to Proceed"
                    : severity === "modify"
                    ? language === "hi" ? "सावधानी / संशोधन आवश्यक" : "Caution / Modify"
                    : language === "hi" ? "चेतावनी / गतिविधि भीतर करें" : "Alert / Move Indoors"}
                </span>
                {scenarioId && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                    Scenario: {scenarioId}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
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

              <p className="text-xs sm:text-sm font-medium opacity-80 mt-1 max-w-2xl leading-relaxed">
                {severity === "allow"
                  ? language === "hi"
                    ? `वायु गुणवत्ता अनुकूल है (AQI ${aqiVal})। सुबह की सभा, पीई और खेलकूद बिना रुकावट हो सकते हैं।`
                    : `Favorable air conditions (Ref AQI ${aqiVal}). Morning assembly, PE, recess, and sports can proceed.`
                  : severity === "modify"
                  ? language === "hi"
                    ? `कण प्रदूषण बढ़ा हुआ है (AQI ${aqiVal})। लंबी गतिविधियों की गति धीमी करें और प्रतिस्पर्धी खेल भीतर कराएं।`
                    : `Elevated particulate pollution (Ref AQI ${aqiVal}). Reduce exercise intensity, increase rest breaks, and move competitive sports indoors.`
                  : language === "hi"
                  ? `गंभीर प्रदूषण (AQI ${aqiVal})। बाहरी संपर्क सीमित करें; सभा और शारीरिक शिक्षा केवल उचित वेंटिलेशन वाले कमरों में कराएं।`
                  : `Hazardous air conditions (Ref AQI ${aqiVal}). Avoid outdoor exposure; move assembly and PE indoors with monitored ventilation.`}
              </p>
            </div>
          </div>

          {/* Large AQI Callout Block */}
          {referenceAqi && (
            <div className="flex sm:flex-col items-center sm:items-end justify-between bg-white/90 p-4 rounded-xl border border-black/10 shadow-xs shrink-0 sm:min-w-44">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Modelled Ref AQI
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight leading-none">
                  {aqiVal}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 500</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md mt-1.5 ${aqiCategory.color}`}>
                {aqiCategory.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cohort Segmented Control & 4 Instant Activity Pills */}
      <div className="p-4 sm:p-5 bg-white">
        {/* Cohort Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectCohort("all_students")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCohort === "all_students"
                  ? "bg-white text-blue-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "सभी विद्यार्थी (All Students)" : "All Students"}</span>
            </button>
            <button
              onClick={() => onSelectCohort("sensitive_pupils")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Assembly */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === "hi" ? "प्रार्थना सभा" : "Assembly"}
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {language === "hi" ? "सुबह की सभा" : "Morning Assembly"}
              </span>
            </div>
            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-bold border ${assembly.badge}`}>
              {assembly.text}
            </span>
          </div>

          {/* Physical Education */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === "hi" ? "शारीरिक शिक्षा" : "Physical Ed"}
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                PE Class
              </span>
            </div>
            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-bold border ${pe.badge}`}>
              {pe.text}
            </span>
          </div>

          {/* Outdoor Recess */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === "hi" ? "मध्यांतर खेल" : "Recess"}
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {language === "hi" ? "बाहरी अवकाश" : "Outdoor Recess"}
              </span>
            </div>
            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-bold border ${recess.badge}`}>
              {recess.text}
            </span>
          </div>

          {/* Competitive Sports */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === "hi" ? "तीव्र खेलकूद" : "Athletics / Sports"}
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {language === "hi" ? "प्रतियोगी खेल" : "Intense Sports"}
              </span>
            </div>
            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-bold border ${sports.badge}`}>
              {sports.text}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
