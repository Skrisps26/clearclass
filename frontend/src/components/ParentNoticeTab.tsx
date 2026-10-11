"use client";

import React, { useState } from "react";
import { Copy, Check, MessageSquare, Share2, Info, CheckCircle2 } from "lucide-react";
import { ParentMessage } from "../types/card";

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
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Intro Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {language === "hi"
                ? "अभिभावक संदेश (प्रसारण हेतु तैयार)"
                : "Ready-to-Broadcast Parent Circulars"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {language === "hi"
                ? "व्हाट्सएप, एसएमएस या स्कूल नोटिस बोर्ड के लिए तैयार द्वैभाषिक संदेश"
                : `Deterministic broadcast copy for ${locationName} school families, grounded in today's Cedar evaluations.`}
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Cards on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* English Circular */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Language Format
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  English Notice (WhatsApp / Circular)
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                EN
              </span>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs leading-relaxed text-slate-800 font-medium select-all whitespace-pre-wrap min-h-36">
              {parentMessage.en}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(parentMessage.en, "en")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  copiedLang === "en"
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-900 hover:bg-blue-800 text-white"
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
              </button>

              <a
                href={getWhatsAppShareUrl(parentMessage.en)}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Share via WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[10px] text-slate-400 font-medium text-center">
              Project reference adaptation · Not an official school-closure notice
            </p>
          </div>
        </div>

        {/* Hindi Circular */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  भाषा प्रारूप
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  हिन्दी नोटिस (WhatsApp / स्कूल सूचना)
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                देवनागरी
              </span>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs leading-relaxed text-slate-800 font-medium select-all whitespace-pre-wrap min-h-36">
              {parentMessage.hi}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(parentMessage.hi, "hi")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  copiedLang === "hi"
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-900 hover:bg-blue-800 text-white"
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
              </button>

              <a
                href={getWhatsAppShareUrl(parentMessage.hi)}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="WhatsApp पर भेजें"
              >
                <Share2 className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[10px] text-slate-400 font-medium text-center">
              परियोजना संदर्भ सलाह · यह आधिकारिक स्कूल बंद होने की कानूनी सूचना नहीं है
            </p>
          </div>
        </div>
      </div>

      {/* Compliance & Disclosure Footnote */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          <strong>Broadcasting Guidance:</strong> These notices are derived deterministically from U.S. EPA AirNow school activity recommendations. They inform parents of school-level activity modifications and classroom airing. Official state directives (such as CAQM GRAP in Delhi-NCR) are evaluated independently by local authorities.
        </p>
      </div>
    </div>
  );
}
