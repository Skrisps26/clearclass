"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, XCircle } from "lucide-react";
import { Verdict, EvidenceSource } from "../types/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface ActivityTabProps {
  verdicts: Verdict[];
  selectedCohort: "all_students" | "sensitive_pupils";
  policySetVersion?: string | null;
  policySources?: EvidenceSource[];
  regulatoryCoverage?: string;
  language: "en" | "hi";
}

const ACTIVITY_META: Record<string, { en: string; hi: string; descEn: string; descHi: string }> = {
  assembly: { en: "Morning Assembly", hi: "सुबह की प्रार्थना सभा", descEn: "Courtyard gathering, flag ceremony & announcements", descHi: "प्रार्थना सभा, राष्ट्रगान व घोषणाएं" },
  pe: { en: "Physical Education (PE)", hi: "शारीरिक शिक्षा (PE)", descEn: "Class curriculum, drills & fitness games", descHi: "कक्षा पाठ्यक्रम, व्यायाम व फिटनेस खेल" },
  recess: { en: "Outdoor Recess", hi: "मध्यांतर अवकाश (खेलकूद)", descEn: "Unstructured play, courtyard break & socialization", descHi: "स्वतंत्र खेल, मैदान में विश्राम" },
  sports: { en: "Competitive & Intense Sports", hi: "प्रतियोगी व तीव्र खेलकूद", descEn: "Football, athletics, endurance practice & matches", descHi: "फुटबॉल, एथलेटिक्स, दौड़ व प्रतिस्पर्धी मैच" },
};

function instruction(verdict: Verdict, language: "en" | "hi") {
  if (verdict.status !== "evaluated") return verdict.reason || (language === "hi"
    ? "पूर्वानुमान के इनपुट उपलब्ध नहीं हैं या सीमा से बाहर हैं; कोई सिफारिश नहीं दी गई है।"
    : "No recommendation evaluated because forecast inputs are missing or out of range.");
  if (verdict.selectedAction === "indoor_relocation_or_reschedule") return language === "hi"
    ? "इस गतिविधि को भीतर कराएं या पुनर्निर्धारित करें।"
    : "Move this activity indoors or reschedule it.";
  if (verdict.selectedAction === "sport_with_breaks_reduced_intensity" || verdict.selectedAction === "ordinary_with_breaks_reduced_intensity") return language === "hi"
    ? "अधिक विराम दें और शारीरिक गतिविधि की तीव्रता कम रखें।"
    : "Take frequent rest breaks and reduce physical intensity.";
  if (verdict.selectedAction) return language === "hi"
    ? "नियमित रूप से बाहर संचालित कर सकते हैं।"
    : "Proceed normally with regular outdoor activities.";
  return verdict.reason || (language === "hi" ? "गतिविधि के लिए नीति निर्णय देखें।" : "Review the policy decision for this activity.");
}

function DecisionBadge({ verdict, language }: { verdict: Verdict; language: "en" | "hi" }) {
  const status = verdict.status === "evaluated" ? verdict.decision : "unknown";
  const styles = {
    allow: "bg-status-allow text-status-allow-foreground",
    modify: "bg-status-modify text-status-modify-foreground",
    deny: "bg-status-deny text-status-deny-foreground",
    unknown: "bg-status-unknown text-status-unknown-foreground",
  }[status];
  const Icon = { allow: CheckCircle2, modify: AlertTriangle, deny: XCircle, unknown: HelpCircle }[status];
  const labels = {
    allow: language === "hi" ? "अनुमति (ALLOW)" : "ALLOW",
    modify: language === "hi" ? "संशोधन (MODIFY)" : "MODIFY",
    deny: language === "hi" ? "अस्वीकृत (DENY)" : "DENY",
    unknown: language === "hi" ? "सलाह अनुपलब्ध" : "WITHHELD",
  };
  return (
    <Badge variant="outline" className={`w-fit shrink-0 gap-1.5 border-transparent px-2.5 py-1 text-[13px] font-semibold ${styles}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />{labels[status]}
    </Badge>
  );
}

export function ActivityTab({ verdicts, selectedCohort, language }: ActivityTabProps) {
  const cohortVerdicts = verdicts.filter((v) => v.cohort === selectedCohort);

  return (
    <section aria-labelledby="activities-title" className="border-y bg-card">
      <div className="border-b px-4 py-3 sm:px-6">
        <h2 id="activities-title" className="text-lg font-semibold">{language === "hi" ? "गतिविधि के अनुसार सलाह" : "Activity-by-activity guidance"}</h2>
      </div>
      {cohortVerdicts.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground sm:px-6">{language === "hi" ? "इस समूह के लिए गतिविधि सलाह उपलब्ध नहीं है।" : "No activity guidance available for this group."}</p>
      ) : (
        <ul className="divide-y">
          {cohortVerdicts.map((v) => {
            const meta = ACTIVITY_META[v.activity] || { en: v.activity, hi: v.activity, descEn: "School activity", descHi: "स्कूल गतिविधि" };
            return (
              <li key={`${v.activity}-${v.cohort}`} className="px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="min-w-0 text-base font-semibold leading-snug">{language === "hi" ? meta.hi : meta.en}</h3>
                  <DecisionBadge verdict={v} language={language} />
                </div>
                <p className="mt-1 text-[15px] leading-snug text-foreground">{instruction(v, language)}</p>
                {(v.modifications.length > 0 || v.sensitivePupilCaveat || v.indoorAirCaveat) && (
                  <div className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
                    {v.modifications.map((modification, index) => <p key={index}>• {modification}</p>)}
                    {v.sensitivePupilCaveat && <p>{v.sensitivePupilCaveat}</p>}
                    {v.indoorAirCaveat && <p>{v.indoorAirCaveat}</p>}
                  </div>
                )}
                <Accordion type="single" collapsible className="mt-1 max-w-[75ch]">
                  <AccordionItem value="evidence" className="border-0">
                    <AccordionTrigger className="w-fit gap-2 py-1 text-sm font-medium text-primary hover:no-underline hover:underline">
                      {language === "hi" ? "सलाह का आधार" : "Why this advice?"}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-1 pt-2 text-sm text-muted-foreground">
                      <p>{language === "hi" ? meta.descHi : meta.descEn}</p>
                      <div>
                        <strong className="font-medium text-foreground">{language === "hi" ? "Cedar नियम" : "Cedar rules"}: </strong>
                        {v.ruleIds.length > 0 ? (
                          <span className="font-mono break-words">{v.ruleIds.join(", ")}</span>
                        ) : (
                          <span>{v.status !== "evaluated" ? "Not evaluated" : "No rule ID provided"}</span>
                        )}
                      </div>
                      {v.sources.length > 0 && <div className="flex flex-col items-start gap-1">
                        {v.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                          {source.title}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </a>)}
                      </div>}
                      {v.inputDescription && <p>{v.inputDescription}</p>}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
