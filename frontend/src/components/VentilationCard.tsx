"use client";

import React, { useState } from "react";
import { Wind, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Layers, HelpCircle } from "lucide-react";
import { Ventilation } from "../types/card";

interface VentilationCardProps {
  ventilation: Ventilation;
  language: "en" | "hi";
}

export function VentilationCard({ ventilation, language }: VentilationCardProps) {
  const [showPhysics, setShowPhysics] = useState(false);

  const isEstimated = ventilation.status === "estimated";
  const schedule = (ventilation.schedule || {}) as Record<string, unknown>;
  const summary = (ventilation.summary || {}) as Record<string, unknown>;
  const inputs = (ventilation.inputs || {}) as Record<string, unknown>;

  const windows = ventilation.flushWindows || [];
  const co2Feasible = ventilation.co2Feasible ?? summary.co2Feasible;

  const maxCo2 = typeof summary.maxEstimatedIndoorCo2Ppm === "number" ? Math.round(summary.maxEstimatedIndoorCo2Ppm) : null;
  const maxPm25 = typeof summary.maxEstimatedIndoorPm25UgM3 === "number" ? Math.round(summary.maxEstimatedIndoorPm25UgM3) : null;
  const integratedPm = typeof summary.integratedIndoorPm25UgHourM3 === "number" ? Math.round(summary.integratedIndoorPm25UgHourM3) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              {language === "hi"
                ? "कक्षा संवातन (Ventilation) अनुमान"
                : "Classroom Ventilation Guidance"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {ventilation.estimateLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEstimated ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                co2Feasible
                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {co2Feasible ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
              {co2Feasible
                ? language === "hi"
                  ? "CO₂ संदर्भ संकेतक पूरा"
                  : "CO₂ Indicator Met"
                : language === "hi"
                ? "CO₂ सीमा पार (कम वेंटिलेशन)"
                : "CO₂ Indicator Exceeded"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              {language === "hi" ? "अनुमान अनुपलब्ध" : "Unavailable"}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {!isEstimated ? (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            <p className="font-semibold text-slate-800">
              {language === "hi"
                ? "संवातन मॉडल उपलब्ध नहीं है"
                : "Ventilation Model Unavailable"}
            </p>
            <p className="mt-1 text-slate-500">
              {ventilation.reason ||
                (language === "hi"
                  ? "वायु पूर्वानुमान डेटा उपलब्ध न होने के कारण संवातन खिड़कियों की गणना नहीं की जा सकी।"
                  : "Requires valid hourly PM2.5 forecast for the selected school hours.")}
            </p>
          </div>
        ) : (
          <>
            {/* Key Modelled Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {language === "hi" ? "सुझाया गया शेड्यूल" : "Recommended Schedule"}
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {typeof schedule.name === "string" ? schedule.name : "Closed"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {schedule.openingAllowed
                    ? language === "hi"
                      ? "10 मिनट प्रति घंटा"
                      : "10-min hourly flush"
                    : language === "hi"
                    ? "खिड़कियाँ बंद"
                    : "Windows closed"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {language === "hi" ? "अधिकतम अनुमानित CO₂" : "Peak Modelled CO₂"}
                </span>
                <span className="text-sm font-bold text-slate-900 mt-1 block font-mono">
                  {maxCo2 !== null ? `${maxCo2} ppm` : "—"}
                </span>
                <span className="text-[10px] text-slate-500">
                  Target: &lt;1,500 ppm
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {language === "hi" ? "अधिकतम भीतरी PM2.5" : "Peak Indoor PM2.5"}
                </span>
                <span className="text-sm font-bold text-slate-900 mt-1 block font-mono">
                  {maxPm25 !== null ? `${maxPm25} µg/m³` : "—"}
                </span>
                <span className="text-[10px] text-slate-500">
                  Single-zone estimate
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {language === "hi" ? "कुल संचित PM2.5" : "Integrated PM2.5"}
                </span>
                <span className="text-sm font-bold text-slate-900 mt-1 block font-mono">
                  {integratedPm !== null ? `${integratedPm} µg·h/m³` : "—"}
                </span>
                <span className="text-[10px] text-slate-500">
                  School hours (08:00–14:30)
                </span>
              </div>
            </div>

            {/* Scheduled Window Open Windows */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-blue-800" />
                {language === "hi"
                  ? "अनुशंसित खिड़की खोलने के समय (फ्लश खिड़कियाँ)"
                  : "Target Window Opening Intervals (Lesson Breaks)"}
              </h4>

              {windows.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {windows.map((win, idx) => {
                    const formatTime = (iso: string) => {
                      try {
                        const d = new Date(iso);
                        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      } catch {
                        return iso;
                      }
                    };
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-900 font-mono text-xs font-medium"
                      >
                        <Wind className="w-3 h-3 text-teal-600" />
                        {formatTime(win.start)} – {formatTime(win.end)}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {language === "hi"
                    ? "कोई खिड़की खोलने की अवधि निर्धारित नहीं है (खिड़कियाँ बंद रखने की सिफारिश)।"
                    : "No window opening flush scheduled. Keep windows closed and monitor air quality."}
                </p>
              )}
            </div>

            {/* Warnings */}
            {ventilation.warnings && ventilation.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    {language === "hi"
                      ? "संवातन संबंधी सावधानी"
                      : "Ventilation Advisory Notice"}
                  </p>
                  <p className="mt-0.5 text-amber-800">
                    {ventilation.warnings.join(" ")}
                  </p>
                </div>
              </div>
            )}

            {/* Physics and Assumptions Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowPhysics(!showPhysics)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-900"
              >
                <Layers className="w-3.5 h-3.5" />
                {showPhysics
                  ? language === "hi"
                    ? "भौतिक मॉडल और गणितीय सूत्र छिपाएं"
                    : "Hide Physical Model & Assumptions"
                  : language === "hi"
                  ? "भौतिक समीकरण (Mass Balance) और उद्धृत स्रोत देखें"
                  : "View Mass-Balance Physics & Sourced Constants"}
                {showPhysics ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showPhysics && (
                <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5 animate-in fade-in-50 duration-150">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Differential Mass-Balance Equations
                    </span>
                    <p className="font-mono text-[11px] text-blue-900 mt-1 bg-white p-2 rounded border border-slate-200">
                      PM2.5: dC/dt = λ · P · Cout - (λ + k) · C<br />
                      CO₂: dC/dt = G / V + λ · (Cout - C)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-semibold text-slate-800">Deposition Rate (k):</span>{" "}
                      0.39 h⁻¹ (U.S. EPA Exposure Factors Handbook, Table 19-6)
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-semibold text-slate-800">CO₂ Baseline:</span>{" "}
                      426 ppm (ASHRAE 2024 global outdoor baseline)
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-semibold text-slate-800">CO₂ Generation (G):</span>{" "}
                      0.31 L/min/person (ASHRAE Standard 62.1 Addendum d)
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-semibold text-slate-800">Airflow Rate:</span>{" "}
                      {typeof inputs.airflowBasis === "string" ? inputs.airflowBasis : "Estover Community College UK Study (0.5 ACH closed, 5 ACH open)"}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200">
                    Model estimates are not physical measurements. Ventilation scheduling does not guarantee compliance with local health regulations or replace on-site carbon dioxide sensors.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
