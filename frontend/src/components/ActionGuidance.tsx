"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, ChevronUp, BookOpen, ShieldAlert, ExternalLink, Info } from "lucide-react";
import { Verdict, EvidenceSource } from "../types/card";

interface ActionGuidanceProps {
  verdicts: Verdict[];
  policySetVersion?: string | null;
  policySources?: EvidenceSource[];
  regulatoryCoverage?: string;
  language: "en" | "hi";
}

const ACTIVITY_LABELS: Record<string, { en: string; hi: string }> = {
  assembly: { en: "Morning Assembly", hi: "सुबह की प्रार्थना सभा" },
  pe: { en: "Physical Education (PE)", hi: "शारीरिक शिक्षा (PE)" },
  recess: { en: "Outdoor Recess", hi: "मध्यांतर (खेलकूद)" },
  sports: { en: "Prolonged / Intense Sports", hi: "लंबे समय का तीव्र खेल" },
};

const COHORT_LABELS: Record<string, { en: string; hi: string }> = {
  all_students: { en: "All Students", hi: "सभी विद्यार्थी" },
  sensitive_pupils: { en: "Sensitive Pupils", hi: "संवेदनशील विद्यार्थी" },
};

export function ActionGuidance({
  verdicts,
  policySetVersion,
  policySources = [],
  regulatoryCoverage = "reference_only",
  language,
}: ActionGuidanceProps) {
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});

  const toggleWhy = (key: string) => {
    setExpandedWhy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Group verdicts by cohort
  const cohorts = ["all_students", "sensitive_pupils"];

  const getDecisionBadge = (decision: string, status: string) => {
    if (status !== "evaluated") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          {language === "hi" ? "सलाह अनुपलब्ध" : "WITHHELD"}
        </span>
      );
    }
    switch (decision) {
      case "allow":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {language === "hi" ? "अनुमति" : "ALLOW"}
          </span>
        );
      case "modify":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {language === "hi" ? "संशोधित" : "MODIFY"}
          </span>
        );
      case "deny":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {language === "hi" ? "अस्वीकृत" : "DENY"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-900" />
            {language === "hi" ? "स्कूल गतिविधि दिशानिर्देश" : "School Activity Guidance"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === "hi"
              ? "U.S. EPA / AirNow दिशानिर्देशों के आधार पर देवदार (Cedar) नीति मूल्यांकन"
              : "Cedar policy evaluation grounded in U.S. EPA / AirNow school guidance"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium border border-slate-200 text-[11px]">
            {regulatoryCoverage === "reference_only"
              ? language === "hi"
                ? "संदर्भ सलाह (स्थानीय आदेश अलग)"
                : "Reference Advisory Only"
              : regulatoryCoverage}
          </span>
          {policySetVersion && (
            <span className="bg-blue-50 text-blue-900 font-mono text-[10px] px-2 py-0.5 rounded border border-blue-200">
              v{policySetVersion.split("@")[1]?.split("#")[0] || policySetVersion}
            </span>
          )}
        </div>
      </div>

      {/* Cohorts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {cohorts.map((cohortKey) => {
          const cohortVerdicts = verdicts.filter((v) => v.cohort === cohortKey);
          if (cohortVerdicts.length === 0) return null;

          const isSensitive = cohortKey === "sensitive_pupils";

          return (
            <div
              key={cohortKey}
              className={`rounded-xl border shadow-xs overflow-hidden transition-all ${
                isSensitive
                  ? "bg-amber-50/20 border-amber-200/80"
                  : "bg-white border-slate-200"
              }`}
            >
              {/* Cohort Header */}
              <div
                className={`px-4 py-3 border-b flex items-center justify-between ${
                  isSensitive
                    ? "bg-amber-100/40 border-amber-200 text-amber-950"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              >
                <div>
                  <h3 className="font-bold text-sm tracking-tight">
                    {COHORT_LABELS[cohortKey]?.[language] || cohortKey}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isSensitive
                      ? language === "hi"
                        ? "अस्थमा या सांस संबंधी संवेदनशीलता वाले विद्यार्थी"
                        : "Students with asthma or respiratory sensitivities"
                      : language === "hi"
                      ? "सामान्य शारीरिक क्षमता वाले सभी छात्र"
                      : "General student population"}
                  </p>
                </div>
              </div>

              {/* Activity Cards List */}
              <div className="p-4 space-y-3.5">
                {cohortVerdicts.map((v) => {
                  const itemKey = `${v.activity}-${v.cohort}`;
                  const isExpanded = !!expandedWhy[itemKey];

                  return (
                    <div
                      key={itemKey}
                      className="p-3.5 rounded-lg border border-slate-200/90 bg-white hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800">
                            {ACTIVITY_LABELS[v.activity]?.[language] || v.activity}
                          </span>

                          <div className="mt-1 text-xs text-slate-600 font-medium">
                            {v.status !== "evaluated" ? (
                              <p className="text-slate-500 italic">
                                {v.reason ||
                                  (language === "hi"
                                    ? "डेटा की कमी के कारण कोई सिफारिश नहीं दी गई।"
                                    : "No recommendation evaluated due to missing or out-of-range input.")}
                              </p>
                            ) : v.selectedAction ? (
                              <p className="text-slate-900 font-semibold">
                                {v.selectedAction === "indoor_relocation_or_reschedule"
                                  ? language === "hi"
                                    ? "गतिविधियों को भीतर स्थानांतरित करें या पुनर्निर्धारित करें।"
                                    : "Move activities indoors or reschedule them."
                                  : v.selectedAction === "sport_with_breaks_reduced_intensity" ||
                                    v.selectedAction === "ordinary_with_breaks_reduced_intensity"
                                  ? language === "hi"
                                    ? "अधिक विराम दें और गतिविधि की तीव्रता कम रखें।"
                                    : "Take more breaks and use less intense activities."
                                  : language === "hi"
                                  ? "सामान्य रूप से जारी रखें।"
                                  : "Proceed normally with regular outdoor activities."}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div>{getDecisionBadge(v.decision, v.status)}</div>
                      </div>

                      {/* Modifications List */}
                      {v.modifications && v.modifications.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <ul className="text-[11px] text-amber-800 space-y-0.5">
                            {v.modifications.map((m, idx) => (
                              <li key={idx} className="flex items-center gap-1.5 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Caveats */}
                      {v.sensitivePupilCaveat && (
                        <div className="mt-2 p-2 rounded bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>{v.sensitivePupilCaveat}</span>
                        </div>
                      )}

                      {v.indoorAirCaveat && (
                        <div className="mt-2 p-2 rounded bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                          <span>{v.indoorAirCaveat}</span>
                        </div>
                      )}

                      {/* Why Drawer Toggle */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => toggleWhy(itemKey)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 hover:text-blue-900"
                        >
                          <BookOpen className="w-3 h-3" />
                          {isExpanded
                            ? language === "hi"
                              ? "कारण विवरण छिपाएं"
                              : "Hide Cedar rule evidence"
                            : language === "hi"
                            ? "निर्णय का कारण और Cedar नियम देखें"
                            : "Why? View Cedar rule & source"}
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {v.referenceAqiInput && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            AQI Input: {v.referenceAqiInput.value}
                          </span>
                        )}
                      </div>

                      {/* Why Expandable Panel */}
                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2 animate-in fade-in-50 duration-150">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Evaluating Cedar Rule(s)
                            </span>
                            {v.ruleIds && v.ruleIds.length > 0 ? (
                              v.ruleIds.map((rid) => (
                                <code
                                  key={rid}
                                  className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-900 block mt-1"
                                >
                                  {rid}
                                </code>
                              ))
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">
                                Default deny / no applicable permission
                              </span>
                            )}
                          </div>

                          {/* Sources */}
                          {v.sources && v.sources.length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                Cited Authoritative Source(s)
                              </span>
                              <div className="space-y-1.5 mt-1">
                                {v.sources.map((s) => (
                                  <a
                                    key={s.id}
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200"
                                  >
                                    <span className="font-semibold">{s.title}</span>
                                    {s.pages && (
                                      <span className="text-slate-500">({s.pages})</span>
                                    )}
                                    <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                            {v.inputDescription}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
