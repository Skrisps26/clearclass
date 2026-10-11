"use client";

import React, { useState } from "react";
import { Bot, User, Send, Loader2, Sparkles, ShieldCheck, HelpCircle } from "lucide-react";
import { sendChatMessage } from "../lib/api";

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[550px] animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === "hi" ? "ClearClass सहायक" : "ClearClass Conversational Assistant"}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                Sydney Bedrock Nova Micro
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {language === "hi"
                ? `${locationName} के वायु पूर्वानुमान और Cedar नियमों पर आधारित द्वैभाषिक प्रश्नोत्तर`
                : `Grounded in ${locationName}'s forecast and Cedar policies via 4 server-side tools.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Strictly Tool-Grounded · No Medical Claims</span>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Intro / Starter Prompts */}
        {messages.length === 0 && (
          <div className="py-6 max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === "hi" ? "आज के निर्णयों पर प्रश्न पूछें" : "Ask About Today's Operational Decisions"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                {language === "hi"
                  ? "सहायक वास्तविक देवदार (Cedar) नियमों और वायु मॉडल का उपयोग करके उत्तर देता है।"
                  : "The assistant evaluates today's CAMS Global air forecast, Cedar rules, and classroom ventilation physics to answer staff operational questions in English or Hindi."}
              </p>
            </div>

            {/* Quick 1-Click Starter Question Chips */}
            <div className="pt-2 text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">
                {language === "hi" ? "त्वरित प्रश्न (1-Click Test Prompts)" : "Suggested 1-Click Test Prompts"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_PROMPTS[language].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-800 font-medium transition-colors hover:border-slate-300"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-medium whitespace-pre-wrap ${
                  isUser
                    ? "bg-blue-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-900 border border-slate-200/90 shadow-2xs"
                }`}
              >
                {m.content}
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium py-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-900" />
            <span>
              {language === "hi"
                ? "सहायक Cedar नीतियों और वायु मॉडल का मूल्यांकन कर रहा है..."
                : "Evaluating Cedar policies and physical mass-balance models in Sydney..."}
            </span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === "hi"
                ? "सहायक से कोई प्रश्न पूछें..."
                : "Ask about morning assembly, PE intensity, window flushing, or sensitive pupils..."
            }
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all font-medium text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{language === "hi" ? "पूछें" : "Ask"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
