"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ExternalLink,
  Info,
  Shield,
  Activity,
} from "lucide-react";
import { Verdict, EvidenceSource } from "../types/card";

interface ActivityTabProps {
  verdicts: Verdict[];
  selectedCohort: "all_students" | "sensitive_pupils";
  policySetVersion?: string | null;
  policySources?: EvidenceSource[];
  regulatoryCoverage?: string;
  language: "en" | "hi";
}

const ACTIVITY_META: Record<
  string,
  { en: string; hi: string; descEn: string; descHi: string }
> = {
  assembly: {
    en: "Morning Assembly",
    hi: "सुबह की प्रार्थना सभा",
    descEn: "Courtyard gathering, flag ceremony & announcements",
    descHi: "प्रार्थना सभा, राष्ट्रगान व घोषणाएं",
  },
  pe: {
    en: "Physical Education (PE)",
    hi: "शारीरिक शिक्षा (PE)",
    descEn: "Class curriculum, drills & fitness games",
    descHi: "कक्षा पाठ्यक्रम, व्यायाम व फिटनेस खेल",
  },
  recess: {
    en: "Outdoor Recess",
    hi: "मध्यांतर अवकाश (खेलकूद)",
    descEn: "Unstructured play, courtyard break & socialization",
    descHi: "स्वतंत्र खेल, मैदान में विश्राम",
  },
  sports: {
    en: "Competitive & Intense Sports",
    hi: "प्रतियोगी व तीव्र खेलकूद",
    descEn: "Football, athletics, endurance practice & matches",
    descHi: "फुटबॉल, एथलेटिक्स, दौड़ व प्रतिस्पर्धी मैच",
  },
};

export function ActivityTab({
  verdicts,
  selectedCohort,
  policySetVersion,
  policySources = [],
  regulatoryCoverage = "reference_only",
  language,
}: ActivityTabProps) {
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});

  const toggleWhy = (key: string) => {
    setExpandedWhy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cohortVerdicts = verdicts.filter((v) => v.cohort === selectedCohort);

  const getDecisionBadge = (decision: string, status: string) => {
    if (status !== "evaluated") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          {language === "hi" ? "सलाह अनुपलब्ध" : "WITHHELD"}
        </span>
      );
    }
    switch (decision) {
      case "allow":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {language === "hi" ? "अनुमति (ALLOW)" : "ALLOW"}
          </span>
        );
      case "modify":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {language === "hi" ? "संशोधित करें (MODIFY)" : "MODIFY"}
          </span>
        );
      case "deny":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {language === "hi" ? "अस्वीकृत (DENY)" : "DENY"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Activity Grid (2x2 on desktop, 1 col on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cohortVerdicts.map((v) => {
          const meta = ACTIVITY_META[v.activity] || {
            en: v.activity,
            hi: v.activity,
            descEn: "School activity",
            descHi: "स्कूल गतिविधि",
          };
          const itemKey = `${v.activity}-${v.cohort}`;
          const isExpanded = !!expandedWhy[itemKey];

          return (
            <div
              key={itemKey}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Activity Name + Decision Badge */}
                <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {language === "hi" ? meta.hi : meta.en}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {language === "hi" ? meta.descHi : meta.descEn}
                    </p>
                  </div>
                  <div>{getDecisionBadge(v.decision, v.status)}</div>
                </div>

                {/* Primary Directive */}
                <div className="py-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                    {language === "hi" ? "कार्यकारी निर्देश" : "Operational Instruction"}
                  </span>

                  {v.status !== "evaluated" ? (
                    <p className="text-xs text-slate-600 font-medium italic">
                      {v.reason ||
                        (language === "hi"
                          ? "डेटा सीमा से बाहर होने के कारण कोई संदर्भ सिफारिश नहीं दी गई है।"
                          : "No recommendation evaluated due to missing or out-of-range forecast inputs.")}
                    </p>
                  ) : v.selectedAction ? (
                    <p className="text-sm text-slate-900 font-bold leading-snug">
                      {v.selectedAction === "indoor_relocation_or_reschedule"
                        ? language === "hi"
                          ? "सभी गतिविधियाँ स्कूल के भीतर कराएं या पुनर्निर्धारित करें।"
                          : "Move all activities indoors or reschedule them."
                        : v.selectedAction === "sport_with_breaks_reduced_intensity" ||
                          v.selectedAction === "ordinary_with_breaks_reduced_intensity"
                        ? language === "hi"
                          ? "अधिक विराम दें और शारीरिक गतिविधि की तीव्रता कम रखें।"
                          : "Take frequent rest breaks and reduce physical intensity."
                        : language === "hi"
                        ? "नियमित रूप से बाहर संचालित कर सकते हैं।"
                        : "Proceed normally with regular outdoor activities."}
                    </p>
                  ) : null}
                </div>

                {/* Modifications List */}
                {v.modifications && v.modifications.length > 0 && (
                  <div className="pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1.5 font-mono">
                      {language === "hi" ? "लागू होने वाले बदलाव" : "Required Modifications"}
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1.5 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                      {v.modifications.map((m, idx) => (
                        <li key={idx} className="flex items-center gap-2 font-medium text-amber-950">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Caveats */}
                {v.sensitivePupilCaveat && (
                  <div className="mb-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2 font-medium">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{v.sensitivePupilCaveat}</span>
                  </div>
                )}

                {v.indoorAirCaveat && (
                  <div className="mb-3 p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-950 flex items-start gap-2 font-medium">
                    <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span>{v.indoorAirCaveat}</span>
                  </div>
                )}
              </div>

              {/* Bottom: Why Drawer Toggle */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => toggleWhy(itemKey)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-blue-900 hover:text-blue-950 py-1 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                    <span>
                      {isExpanded
                        ? language === "hi"
                          ? "नीति प्रमाण छुपाएं"
                          : "Hide Cedar rule evidence"
                        : language === "hi"
                        ? "कारण देखें (Cedar Rule & Evidence)"
                        : "Why? View Cedar Rule & Evidence"}
                    </span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Collapsible Why Panel with Dark Syntax Block */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-in fade-in-50 duration-150">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
                        Evaluating Cedar Rule `@id`
                      </span>
                      {v.ruleIds && v.ruleIds.length > 0 ? (
                        v.ruleIds.map((rid) => (
                          <div
                            key={rid}
                            className="bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 font-mono text-[11px] mt-1.5 overflow-x-auto shadow-inner"
                          >
                            <span className="text-amber-400">@id</span>
                            <span className="text-slate-400">(</span>
                            <span className="text-emerald-400">"{rid}"</span>
                            <span className="text-slate-400">)</span>
                            <br />
                            <span className="text-blue-400">{v.decision === "allow" ? "permit" : v.decision === "modify" ? "permit" : "forbid"}</span>
                            <span className="text-slate-300"> (principal, action, resource);</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500 italic text-[11px] block mt-0.5">
                          Default deny / no applicable permission
                        </span>
                      )}
                    </div>

                    {v.sources && v.sources.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">
                          Cited Authority Source
                        </span>
                        <div className="space-y-1">
                          {v.sources.map((s) => (
                            <a
                              key={s.id}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-800 hover:underline flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 font-medium"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/80 font-medium">
                      {v.inputDescription}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
