"use client";

import React, { useState } from "react";
import { Bot, User, Send, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { sendChatMessage } from "../lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <Card className="rounded-2xl border border-border shadow-card overflow-hidden flex flex-col min-h-[560px] animate-in fade-in-50 duration-200">
      {/* Header */}
      <CardHeader className="p-5 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3>
                <CardTitle className="text-base font-bold text-card-foreground tracking-tight">
                  {language === "hi" ? "ClearClass सहायक" : "ClearClass Conversational Assistant"}
                </CardTitle>
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-900 border-blue-200 font-mono">
                Sydney Bedrock Nova Micro
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground font-medium mt-0.5">
              {language === "hi"
                ? `${locationName} के वायु पूर्वानुमान और Cedar नियमों पर आधारित द्वैभाषिक प्रश्नोत्तर`
                : `Grounded in ${locationName}'s forecast and Cedar policies via 4 server-side tools.`}
            </CardDescription>
          </div>
        </div>

        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-medium bg-background shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tool-Grounded · No Medical Claims</span>
        </Badge>
      </CardHeader>

      {/* Main Conversation Stream */}
      <CardContent className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Intro / Starter Prompts */}
        {messages.length === 0 && (
          <div className="py-6 max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-card-foreground tracking-tight">
                {language === "hi" ? "आज के निर्णयों पर प्रश्न पूछें" : "Ask About Today's Operational Decisions"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                {language === "hi"
                  ? "सहायक वास्तविक देवदार (Cedar) नियमों और वायु मॉडल का उपयोग करके उत्तर देता है।"
                  : "The assistant evaluates today's CAMS Global air forecast, Cedar rules, and classroom ventilation physics to answer staff operational questions in English or Hindi."}
              </p>
            </div>

            {/* Quick 1-Click Starter Question Chips */}
            <div className="pt-2 text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block text-center font-mono">
                {language === "hi" ? "त्वरित प्रश्न (1-Click Test Prompts)" : "Suggested 1-Click Test Prompts"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_PROMPTS[language].map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    onClick={() => handleSend(prompt)}
                    className="p-3.5 h-auto text-left rounded-xl border border-border bg-muted/40 hover:bg-blue-50/50 hover:border-blue-300 hover:shadow-2xs text-xs font-medium transition-all justify-start whitespace-normal"
                  >
                    "{prompt}"
                  </Button>
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
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-muted/50 text-card-foreground border border-border/90 shadow-2xs"
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>
              {language === "hi"
                ? "सहायक Cedar नीतियों और वायु मॉडल का मूल्यांकन कर रहा है..."
                : "Evaluating Cedar policies and physical mass-balance models in Sydney..."}
            </span>
          </div>
        )}
      </CardContent>

      {/* Input Bar using CardFooter */}
      <CardFooter className="p-4 border-t border-border bg-muted/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 w-full"
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
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all font-medium text-foreground placeholder:text-muted-foreground shadow-2xs"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl px-4 py-2.5 text-xs font-bold gap-1.5 shadow-xs shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{language === "hi" ? "पूछें" : "Ask"}</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
