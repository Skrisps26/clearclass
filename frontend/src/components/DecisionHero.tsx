"use client";

import { Verdict, ReferenceAqi } from "../types/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DecisionHeroProps {
  verdicts: Verdict[];
  referenceAqi?: ReferenceAqi | null;
  locationName: string;
  selectedCohort: "all_students" | "sensitive_pupils";
  onSelectCohort: (cohort: "all_students" | "sensitive_pupils") => void;
  language: "en" | "hi";
  scenarioId?: string | null;
  compact?: boolean;
}

function aqiCategory(value: number, language: "en" | "hi") {
  if (value <= 50) return language === "hi" ? "अच्छा (Good)" : "Good Air";
  if (value <= 100) return language === "hi" ? "मध्यम (Moderate)" : "Moderate Air";
  if (value <= 150) return language === "hi" ? "संवेदनशील वर्ग हेतु अस्वस्थ" : "Unhealthy for Sensitive";
  if (value <= 200) return language === "hi" ? "अस्वस्थ (Unhealthy)" : "Unhealthy Air";
  if (value <= 300) return language === "hi" ? "अत्यंत अस्वस्थ (Very Unhealthy)" : "Very Unhealthy";
  return language === "hi" ? "गंभीर / खतरनाक (Hazardous)" : "Hazardous Air";
}

export function DecisionHero({
  verdicts,
  referenceAqi,
  locationName,
  selectedCohort,
  onSelectCohort,
  language,
  scenarioId,
  compact = false,
}: DecisionHeroProps) {
  const cohortVerdicts = verdicts.filter((v) => v.cohort === selectedCohort);
  const incomplete = cohortVerdicts.length === 0 || cohortVerdicts.some((v) => v.status !== "evaluated");
  const severity: "unknown" | "deny" | "modify" | "allow" = incomplete
    ? "unknown"
    : cohortVerdicts.some((v) => v.decision === "deny")
      ? "deny"
      : cohortVerdicts.some((v) => v.decision === "modify")
        ? "modify"
        : "allow";
  const copy = {
    unknown: {
      en: "Some activity guidance is unavailable",
      hi: "कुछ गतिविधियों की सलाह उपलब्ध नहीं है",
      detailEn: "Check each activity before setting today's schedule.",
      detailHi: "आज की समय-सारणी तय करने से पहले हर गतिविधि की स्थिति देखें।",
      statusEn: "Guidance incomplete",
      statusHi: "सलाह अधूरी है",
    },
    deny: {
      en: "Move affected activities indoors or reschedule",
      hi: "प्रभावित गतिविधियाँ भीतर कराएं या पुनर्निर्धारित करें",
      detailEn: "Review the individual instructions below before changing the schedule.",
      detailHi: "समय-सारणी बदलने से पहले नीचे प्रत्येक गतिविधि का निर्देश देखें।",
      statusEn: "Some activities restricted",
      statusHi: "कुछ गतिविधियाँ प्रतिबंधित",
    },
    modify: {
      en: "Adjust outdoor activities",
      hi: "बाहरी गतिविधियों में बदलाव करें",
      detailEn: "Review the changes and caveats for each activity below.",
      detailHi: "हर गतिविधि के बदलाव और सावधानियाँ नीचे देखें।",
      statusEn: "Changes required",
      statusHi: "बदलाव आवश्यक",
    },
    allow: {
      en: "Outdoor activities may proceed",
      hi: "बाहरी गतिविधियाँ जारी रख सकते हैं",
      detailEn: "Check each activity below before setting the schedule.",
      detailHi: "समय-सारणी तय करने से पहले नीचे हर गतिविधि देखें।",
      statusEn: "Activities assessed",
      statusHi: "गतिविधियों की जाँच पूरी",
    },
  }[severity];
  const statusStyle = {
    allow: "bg-status-allow text-status-allow-foreground",
    modify: "bg-status-modify text-status-modify-foreground",
    deny: "bg-status-deny text-status-deny-foreground",
    unknown: "bg-status-unknown text-status-unknown-foreground",
  }[severity];

  return (
    <section aria-labelledby="decision-title" className="border-y bg-card px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{locationName}</span>
        <span aria-hidden="true">·</span>
        {scenarioId
          ? <span className="text-primary">{language === "hi" ? "डेमो परिस्थिति" : "Demo scenario"}: {scenarioId}</span>
          : <span>{language === "hi" ? "आज का निर्णय" : "Today's decision"}</span>}
      </div>
      <div className="mt-1.5 flex flex-col justify-between gap-2 sm:flex-row sm:items-start sm:gap-5">
        <div className="min-w-0">
          <h1 id="decision-title" className="max-w-[26ch] text-[23px] font-semibold leading-[1.2] tracking-tight sm:text-[28px]">
            {language === "hi" ? copy.hi : copy.en}
          </h1>
          {(!compact || severity === "unknown") && (
            <p className="mt-1.5 max-w-[68ch] text-[15px] leading-snug text-muted-foreground">
              {language === "hi" ? copy.detailHi : copy.detailEn}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Badge variant="outline" className={`w-fit shrink-0 border-transparent px-2.5 py-1 text-sm font-medium ${statusStyle}`}>
          {language === "hi" ? copy.statusHi : copy.statusEn}
        </Badge>
        {referenceAqi != null && (
          <span className="text-sm text-muted-foreground">{referenceAqi.modelled ? "Modelled Ref AQI" : "Reference AQI"} <strong className="font-mono font-semibold tabular-nums text-foreground">{referenceAqi.value}</strong> <span aria-hidden="true">·</span> {aqiCategory(referenceAqi.value, language)}</span>
        )}
      </div>
      <div className="mt-3 border-t pt-2.5">
        <span className="mr-2 text-sm text-muted-foreground">{language === "hi" ? "समूह" : "Group"}</span>
        <Tabs value={selectedCohort} onValueChange={(value) => onSelectCohort(value as "all_students" | "sensitive_pupils")} className="inline-block max-w-full align-middle">
          <TabsList className="h-auto max-w-full rounded-md bg-muted p-1">
            <TabsTrigger value="all_students" className="min-h-8 px-2 text-[13px] shadow-none sm:px-3 sm:text-sm">
              {language === "hi" ? "सभी विद्यार्थी" : "All students"}
            </TabsTrigger>
            <TabsTrigger value="sensitive_pupils" className="min-h-8 px-2 text-[13px] shadow-none sm:px-3 sm:text-sm">
              {language === "hi" ? "संवेदनशील विद्यार्थी" : "Sensitive pupils"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}
