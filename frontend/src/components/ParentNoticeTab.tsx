"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ParentMessage } from "../types/card";
import { Button } from "@/components/ui/button";

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

  const notices = [
    {
      language: "en",
      heading: "English notice",
      copyLabel: "Copy English notice",
      copiedLabel: "Copied to clipboard",
      whatsappLabel: "Share on WhatsApp",
      text: parentMessage.en,
    },
    {
      language: "hi",
      heading: "हिन्दी सूचना",
      copyLabel: "हिन्दी सूचना कॉपी करें",
      copiedLabel: "संदेश कॉपी हो गया",
      whatsappLabel: "WhatsApp पर भेजें",
      text: parentMessage.hi,
    },
  ] as const;

  return (
    <section className="space-y-6" aria-labelledby="parent-notices-heading">
      <header className="border-b border-border pb-4">
        <h2
          id="parent-notices-heading"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          {language === "hi" ? "अभिभावक सूचना" : "Parent notices"}
        </h2>
        <p className="mt-1 text-[15px] leading-6 text-muted-foreground">
          {language === "hi"
            ? "व्हाट्सएप, एसएमएस या स्कूल सूचना के लिए तैयार द्विभाषी संदेश"
            : `Ready-to-send messages for ${locationName} school families.`}
        </p>
      </header>

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        {notices.map((notice) => {
          const isCopied = copiedLang === notice.language;

          return (
            <article
              key={notice.language}
              className="border-y border-border py-5"
              aria-labelledby={`${notice.language}-notice-heading`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3
                  id={`${notice.language}-notice-heading`}
                  className="text-base font-semibold text-foreground"
                >
                  {notice.heading}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {notice.language === "en" ? "English" : "हिन्दी"}
                </span>
              </div>

              <div className="mt-4 whitespace-pre-wrap text-[15px] leading-6 text-foreground select-all">
                {notice.text}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                <Button
                  onClick={() => copyToClipboard(notice.text, notice.language)}
                  className={
                    isCopied
                      ? "bg-status-allow text-status-allow-foreground hover:bg-status-allow/80"
                      : ""
                  }
                >
                  {isCopied && <CheckCircle2 className="size-4" aria-hidden="true" />}
                  {isCopied ? notice.copiedLabel : notice.copyLabel}
                </Button>
                <a
                  href={getWhatsAppShareUrl(notice.text)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[15px] font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {notice.whatsappLabel}
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="border-t border-border pt-4 text-[15px] leading-6 text-muted-foreground">
        <p>
          <strong className="font-semibold text-foreground">
            {language === "hi" ? "महत्वपूर्ण:" : "Important:"}
          </strong>{" "}
          {language === "hi"
            ? "ये संदेश U.S. EPA AirNow स्कूल गतिविधि अनुशंसाओं पर आधारित परियोजना संदर्भ सलाह हैं। ये आधिकारिक स्कूल-बंद सूचना या कानूनी निर्देश नहीं हैं; स्थानीय अधिकारी स्वतंत्र रूप से आधिकारिक निर्देश तय करते हैं।"
            : "These messages are project-reference guidance based on U.S. EPA AirNow school activity recommendations. They are not an official school-closure notice or legal directive; local authorities determine official directions independently."}
        </p>
      </aside>
    </section>
  );
}
