"use client";

import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { sendChatMessage } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AssistantTabProps {
  schoolId: string;
  locationId?: number;
  scenario?: string | null;
  language: "en" | "hi";
  locationName: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = {
  en: [
    "Can students do physical education (PE) outside this morning?",
    "When should we open classroom windows to flush CO2?",
    "What specific measures are required for sensitive pupils today?",
    "Why are competitive sports modified or moved indoors?",
  ],
  hi: [
    "क्या आज सुबह बच्चे बाहर शारीरिक शिक्षा (PE) कर सकते हैं?",
    "कक्षाओं की खिड़कियाँ कब खोलनी चाहिए?",
    "अस्थमा और संवेदनशील विद्यार्थियों के लिए क्या निर्देश हैं?",
    "क्या आज दोपहर में बाहर दौड़ना और खेलकूद सुरक्षित है?",
  ],
};

export function AssistantTab({
  schoolId,
  locationId,
  scenario,
  language,
  locationName,
}: AssistantTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
      const result = await sendChatMessage(
        schoolId,
        text,
        locationId,
        scenario,
        language,
        historyPayload
      );
      setMessages([...newMessages, { role: "assistant", content: result.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            language === "hi"
              ? "सहायक सेवा में अस्थायी त्रुटि हुई। कृपया ऊपर दिए गए Cedar दिशानिर्देश कार्ड का पालन करें।"
              : "Assistant service unavailable. Please rely on the primary Cedar activity guidance above.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="assistant-heading"
      className="border border-border bg-card"
    >
      <header className="border-b border-border px-4 py-4 sm:px-5">
        <h2
          id="assistant-heading"
          className="text-lg font-semibold text-card-foreground"
        >
          {language === "hi" ? "ClearClass सहायक" : "ClearClass Conversational Assistant"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {language === "hi"
            ? `${locationName} के वायु पूर्वानुमान और Cedar नियमों पर आधारित द्वैभाषिक प्रश्नोत्तर`
            : `Grounded in ${locationName}'s forecast and Cedar policies via 4 server-side tools.`}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Sydney Bedrock Nova Micro · No Medical Claims
        </p>
      </header>

      <div className="px-4 py-5 sm:px-5">
        {messages.length === 0 && (
          <section aria-labelledby="assistant-prompts-heading">
            <h3
              id="assistant-prompts-heading"
              className="text-base font-semibold text-card-foreground"
            >
              {language === "hi" ? "आज के निर्णयों पर प्रश्न पूछें" : "Ask About Today's Operational Decisions"}
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {language === "hi"
                ? "सहायक वास्तविक देवदार (Cedar) नियमों और वायु मॉडल का उपयोग करके उत्तर देता है।"
                : "The assistant evaluates today's CAMS Global air forecast, Cedar rules, and classroom ventilation physics to answer staff operational questions in English or Hindi."}
            </p>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-card-foreground">
                {language === "hi" ? "त्वरित प्रश्न" : "Suggested questions"}
              </p>
              <ul className="border-y border-border">
                {STARTER_PROMPTS[language].map((prompt, idx) => (
                  <li key={idx} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="w-full px-3 py-3 text-left text-sm leading-6 text-foreground transition-colors hover:bg-muted focus-visible:bg-muted"
                    >
                      {prompt}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {messages.length > 0 && (
          <section aria-label={language === "hi" ? "सहायक वार्तालाप" : "Assistant conversation"}>
            <ol className="border-y border-border">
              {messages.map((message, idx) => {
                const isUser = message.role === "user";
                return (
                  <li
                    key={idx}
                    className={`px-3 py-4 ${idx > 0 ? "border-t border-border" : ""}`}
                  >
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isUser
                        ? language === "hi"
                          ? "कर्मचारी"
                          : "Staff"
                        : language === "hi"
                          ? "ClearClass सहायक"
                          : "ClearClass Assistant"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-card-foreground">
                      {message.content}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {loading && (
          <div
            aria-live="polite"
            className="flex items-center gap-2 py-3 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              {language === "hi"
                ? "सहायक Cedar नीतियों और वायु मॉडल का मूल्यांकन कर रहा है..."
                : "Evaluating Cedar policies and physical mass-balance models in Sydney..."}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="assistant-question" className="sr-only">
            {language === "hi" ? "सहायक से प्रश्न पूछें" : "Ask the assistant a question"}
          </label>
          <Input
            id="assistant-question"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === "hi"
                ? "सहायक से कोई प्रश्न पूछें..."
                : "Ask about morning assembly, PE intensity, window flushing, or sensitive pupils..."
            }
            className="h-11 min-w-0 flex-1 text-sm shadow-none"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 shrink-0 rounded-md px-4 text-sm font-medium"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{language === "hi" ? "पूछें" : "Ask"}</span>
          </Button>
        </form>
      </div>
    </section>
  );
}
