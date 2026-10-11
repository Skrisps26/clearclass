"use client";

import React, { useState } from "react";
import { Copy, Check, MessageSquare, AlertCircle } from "lucide-react";
import { ParentMessage } from "../types/card";

interface ParentMessagesProps {
  parentMessage: ParentMessage;
  language: "en" | "hi";
}

export function ParentMessages({ parentMessage, language }: ParentMessagesProps) {
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const copyToClipboard = async (text: string, lang: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLang(lang);
      setTimeout(() => setCopiedLang(null), 2500);
    } catch (err) {
      // fallback
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              {language === "hi"
                ? "अभिभावक संदेश (कॉपी करने के लिए तैयार)"
                : "Ready-to-Copy Parent Messages"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === "hi"
                ? "व्हाट्सएप, एसएमएस या स्कूल सर्कुलर के लिए द्वैभाषिक संदेश"
                : "Deterministic English and Hindi broadcast templates"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Card */}
        <div className="flex flex-col justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                English Circular / WhatsApp
              </span>
              <button
                onClick={() => copyToClipboard(parentMessage.en, "en")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                {copiedLang === "en" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-800 font-medium whitespace-pre-wrap select-all">
              {parentMessage.en}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-medium">
            Project reference guidance · Not an official school-closure notice
          </div>
        </div>

        {/* Hindi Card */}
        <div className="flex flex-col justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                हिन्दी संदेश (WhatsApp / नोटिस)
              </span>
              <button
                onClick={() => copyToClipboard(parentMessage.hi, "hi")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                {copiedLang === "hi" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">कॉपी हो गया!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>संदेश कॉपी करें</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-800 font-medium whitespace-pre-wrap select-all">
              {parentMessage.hi}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-medium">
            परियोजना संदर्भ सलाह · यह आधिकारिक स्कूल बंद होने की सूचना नहीं है
          </div>
        </div>
      </div>
    </div>
  );
}
