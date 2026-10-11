"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Sparkles, Bot, User, Loader2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { sendChatMessage } from "../lib/api";

interface GroundedChatProps {
  schoolId: string;
  locationId?: number;
  scenario?: string | null;
  language: "en" | "hi";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = {
  en: [
    "Can students do physical education (PE) outside this morning?",
    "When should we open classroom windows to flush CO2?",
    "Are sports practices allowed for sensitive pupils today?",
  ],
  hi: [
    "क्या आज सुबह बच्चे बाहर प्रार्थना सभा कर सकते हैं?",
    "कक्षाओं की खिड़कियाँ कब खोलनी चाहिए?",
    "क्या संवेदनशील विद्यार्थियों के लिए खेलकूद की अनुमति है?",
  ],
};

export function GroundedChat({ schoolId, locationId, scenario, language }: GroundedChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to receive reply";
      setError(errorMsg);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            language === "hi"
              ? "तकनीकी त्रुटि के कारण उत्तर नहीं मिल सका। कृपया मुख्य कार्ड के दिशानिर्देशों का पालन करें।"
              : "Assistant service unavailable. Please rely on the primary Cedar guidance card above.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Drawer Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors bg-slate-50/40"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
              {language === "hi"
                ? "ClearClass सहायक से प्रश्न पूछें"
                : "Ask ClearClass Grounded Assistant"}
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded border border-blue-200">
                Bedrock Nova Micro
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === "hi"
                ? "स्थान, वायु पूर्वानुमान और Cedar नियमों पर आधारित द्वैभाषिक प्रश्नोत्तर"
                : "Grounded conversational advice strictly tool-governed by today's forecast and Cedar policies"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>{isOpen ? (language === "hi" ? "छिपाएं" : "Collapse") : language === "hi" ? "खोलें" : "Expand"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Chat Body */}
      {isOpen && (
        <div className="p-4 border-t border-slate-200 space-y-4 animate-in fade-in-50 duration-150">
          {/* Suggested Starter Prompts */}
          {messages.length === 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                {language === "hi" ? "सुझाए गए प्रश्न" : "Suggested Questions"}
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS[language].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Log */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-80 overflow-y-auto p-1">
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed font-medium whitespace-pre-wrap ${
                        isUser
                          ? "bg-blue-900 text-white"
                          : "bg-slate-100 text-slate-900 border border-slate-200/80"
                      }`}
                    >
                      {m.content}
                    </div>
                    {isUser && (
                      <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-900" />
                  <span>
                    {language === "hi"
                      ? "सहायक उत्तर तैयार कर रहा है..."
                      : "Assistant is evaluating policy tools and formulating reply..."}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-100"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === "hi"
                  ? "वायु गुणवत्ता या गतिविधियों के बारे में प्रश्न पूछें..."
                  : "Ask about sports, recess, ventilation, or air safety..."
              }
              className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all font-medium text-slate-900"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{language === "hi" ? "भेजें" : "Send"}</span>
            </button>
          </form>

          {/* Grounding and Safety Disclaimer */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              All answers are strictly tool-grounded in verified Cedar policies & CAMS Global forecasts. No medical or legal guarantees.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
