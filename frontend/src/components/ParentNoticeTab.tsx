"use client";

import React, { useState } from "react";
import { Copy, MessageSquare, Share2, Info, CheckCircle2 } from "lucide-react";
import { ParentMessage } from "../types/card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ParentNoticeTabProps {
  parentMessage: ParentMessage;
  language: "en" | "hi";
  locationName: string;
}

export function ParentNoticeTab({
  parentMessage,
  language,
  locationName,
}: ParentNoticeTabProps) {
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const copyToClipboard = async (text: string, lang: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLang(lang);
      setTimeout(() => setCopiedLang(null), 2500);
    } catch {
      // fallback
    }
  };

  const getWhatsAppShareUrl = (text: string) => {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Intro Header Card */}
      <Card className="rounded-2xl border border-border shadow-card">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-card-foreground tracking-tight">
              {language === "hi"
                ? "अभिभावक सूचना (प्रसारण हेतु तैयार)"
                : "Ready-to-Broadcast Parent Circulars"}
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {language === "hi"
                ? "व्हाट्सएप, एसएमएस या स्कूल नोटिस बोर्ड के लिए तैयार द्वैभाषिक संदेश"
                : `Deterministic broadcast copy for ${locationName} school families, grounded in today's Cedar evaluations.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Cards on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Circular */}
        <Card className="rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block font-mono">
                  Format
                </span>
                <h3>
                  <CardTitle className="text-sm font-bold text-card-foreground tracking-tight">
                    English Notice (WhatsApp / Circular)
                  </CardTitle>
                </h3>
              </div>
              <Badge variant="secondary" className="font-mono font-bold text-[10px]">
                EN
              </Badge>
            </CardHeader>

            <CardContent className="p-5">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs leading-relaxed text-card-foreground font-medium select-all whitespace-pre-wrap min-h-36">
                {parentMessage.en}
              </div>
            </CardContent>
          </div>

          <div className="p-5 pt-0 space-y-2.5">
            <div className="flex items-center gap-2">
              <Button
                variant={copiedLang === "en" ? "default" : "default"}
                onClick={() => copyToClipboard(parentMessage.en, "en")}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  copiedLang === "en" ? "bg-emerald-600 hover:bg-emerald-700" : ""
                }`}
              >
                {copiedLang === "en" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy English Notice</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                asChild
                className="shrink-0"
              >
                <a
                  href={getWhatsAppShareUrl(parentMessage.en)}
                  target="_blank"
                  rel="noreferrer"
                  title="Share via WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground font-medium text-center">
              Project reference adaptation · Not an official school-closure notice
            </p>
          </div>
        </Card>

        {/* Hindi Circular */}
        <Card className="rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block font-mono">
                  भाषा प्रारूप
                </span>
                <h3>
                  <CardTitle className="text-sm font-bold text-card-foreground tracking-tight">
                    हिन्दी नोटिस (WhatsApp / स्कूल सूचना)
                  </CardTitle>
                </h3>
              </div>
              <Badge variant="outline" className="font-mono font-bold text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                देवनागरी
              </Badge>
            </CardHeader>

            <CardContent className="p-5">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs leading-relaxed text-card-foreground font-medium select-all whitespace-pre-wrap min-h-36">
                {parentMessage.hi}
              </div>
            </CardContent>
          </div>

          <div className="p-5 pt-0 space-y-2.5">
            <div className="flex items-center gap-2">
              <Button
                variant={copiedLang === "hi" ? "default" : "default"}
                onClick={() => copyToClipboard(parentMessage.hi, "hi")}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  copiedLang === "hi" ? "bg-emerald-600 hover:bg-emerald-700" : ""
                }`}
              >
                {copiedLang === "hi" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>संदेश कॉपी हो गया!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>संदेश कॉपी करें (Copy Hindi)</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                asChild
                className="shrink-0"
              >
                <a
                  href={getWhatsAppShareUrl(parentMessage.hi)}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp पर भेजें"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground font-medium text-center">
              परियोजना संदर्भ सलाह · यह आधिकारिक स्कूल बंद होने की कानूनी सूचना नहीं है
            </p>
          </div>
        </Card>
      </div>

      {/* Compliance & Disclosure Footnote */}
      <Card className="rounded-2xl border border-border shadow-card">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            <strong>Broadcasting Guidance:</strong> These notices are derived deterministically from U.S. EPA AirNow school activity recommendations. They inform parents of school-level activity modifications and classroom airing. Official state directives (such as CAQM GRAP in Delhi-NCR) are evaluated independently by local authorities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
