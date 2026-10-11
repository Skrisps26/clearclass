"use client";

import React, { useState } from "react";
import {
  Wind,
  Clock,
  AlertCircle,
  CheckCircle2,
  Layers,
  LineChart as ChartIcon,
  Table as TableIcon,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Ventilation, AirHour } from "../types/card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface VentilationTabProps {
  ventilation: Ventilation;
  hourly: AirHour[];
  timezone?: string;
  language: "en" | "hi";
}

export function VentilationTab({
  ventilation,
  hourly,
  language,
}: VentilationTabProps) {
  const [chartViewMode, setChartViewMode] = useState<"chart" | "table">("chart");

  const isEstimated = ventilation.status === "estimated";
  const schedule = (ventilation.schedule || {}) as Record<string, unknown>;
  const summary = (ventilation.summary || {}) as Record<string, unknown>;
  const inputs = (ventilation.inputs || {}) as Record<string, unknown>;
  const windows = ventilation.flushWindows || [];
  const co2Feasible = ventilation.co2Feasible ?? summary.co2Feasible;

  const maxCo2 = typeof summary.maxEstimatedIndoorCo2Ppm === "number" ? Math.round(summary.maxEstimatedIndoorCo2Ppm) : null;
  const maxPm25 = typeof summary.maxEstimatedIndoorPm25UgM3 === "number" ? Math.round(summary.maxEstimatedIndoorPm25UgM3) : null;
  const integratedPm = typeof summary.integratedIndoorPm25UgHourM3 === "number" ? Math.round(summary.integratedIndoorPm25UgHourM3) : null;

  // Chart data formatting
  const chartData = (hourly || []).map((h) => {
    let hourLabel = h.time;
    try {
      const d = new Date(h.localTime || h.time);
      hourLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      // fallback
    }
    return {
      time: hourLabel,
      pm25: h.pm25 !== null && h.pm25 !== undefined ? Math.round(h.pm25) : null,
      pm10: h.pm10 !== null && h.pm10 !== undefined ? Math.round(h.pm10) : null,
      aqi: h.referenceAqi !== null && h.referenceAqi !== undefined ? h.referenceAqi : null,
    };
  });

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Top Airing Strategy Card */}
      <Card className="rounded-2xl border border-border shadow-card">
        <CardHeader className="p-5 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-card-foreground tracking-tight">
                {language === "hi"
                  ? "कक्षा संवातन (Ventilation) रणनीति"
                  : "Classroom Airing & Ventilation Schedule"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                {language === "hi"
                  ? "भीतरी CO₂ जमाव को कम करते हुए PM2.5 जोखिम को न्यूनतम रखने का गणितीय मॉडल"
                  : "Physical mass-balance model balancing indoor CO₂ accumulation against outdoor PM2.5"}
              </CardDescription>
            </div>
          </div>

          <div>
            {isEstimated ? (
              <Badge
                variant="outline"
                className={`gap-1.5 px-3 py-1 text-xs font-bold ${
                  co2Feasible
                    ? "bg-teal-50 text-teal-900 border-teal-200"
                    : "bg-amber-50 text-amber-900 border-amber-200"
                }`}
              >
                {co2Feasible ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>
                  {co2Feasible
                    ? language === "hi"
                      ? "CO₂ मानक पूरा (सुरक्षित)"
                      : "CO₂ Safe Benchmark Met"
                    : language === "hi"
                    ? "CO₂ सीमा से अधिक"
                    : "CO₂ Benchmark Exceeded"}
                </span>
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 px-3 py-1 text-xs font-bold bg-muted text-muted-foreground">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{language === "hi" ? "मॉडल अनुपलब्ध" : "Model Unavailable"}</span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {!isEstimated ? (
            <div className="text-xs text-muted-foreground font-medium">
              <p className="font-bold text-card-foreground">
                {language === "hi"
                  ? "संवातन पूर्वानुमान उपलब्ध नहीं है"
                  : "Ventilation Forecast Unavailable"}
              </p>
              <p className="mt-1">
                {ventilation.reason ||
                  (language === "hi"
                    ? "स्थान का सटीक प्रति घंटा वायु गुणवत्ता डेटा न होने के कारण खिड़की खोलने की अवधि की गणना नहीं की जा सकी।"
                    : "Requires complete hourly PM2.5 forecast for school hours.")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 4 Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-muted/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block font-mono">
                    {language === "hi" ? "फ्लश शेड्यूल" : "Schedule"}
                  </span>
                  <span className="text-sm font-bold text-card-foreground block mt-1">
                    {typeof schedule.name === "string" ? schedule.name : "Closed"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {schedule.openingAllowed
                      ? language === "hi"
                        ? "10 मिनट प्रति घंटा"
                        : "10-min hourly flush"
                      : language === "hi"
                      ? "खिड़कियाँ बंद रखें"
                      : "Windows closed"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block font-mono">
                    {language === "hi" ? "अधिकतम अनुमानित CO₂" : "Peak Indoor CO₂"}
                  </span>
                  <span className="text-base font-extrabold text-card-foreground block mt-1 font-mono">
                    {maxCo2 !== null ? `${maxCo2} ppm` : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    UK DfE Benchmark: &lt;1,500 ppm
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block font-mono">
                    {language === "hi" ? "अधिकतम भीतरी PM2.5" : "Peak Indoor PM2.5"}
                  </span>
                  <span className="text-base font-extrabold text-card-foreground block mt-1 font-mono">
                    {maxPm25 !== null ? `${maxPm25} µg/m³` : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Infiltration estimate
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block font-mono">
                    {language === "hi" ? "कुल संचित PM2.5" : "Integrated PM2.5"}
                  </span>
                  <span className="text-base font-extrabold text-card-foreground block mt-1 font-mono">
                    {integratedPm !== null ? `${integratedPm} µg·h/m³` : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    08:00 – 14:30 school day
                  </span>
                </div>
              </div>

              {/* Target Window Flush Times Timeline */}
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80">
                <div className="flex items-center gap-2 mb-2.5">
                  <Clock className="w-4 h-4 text-teal-800 shrink-0" />
                  <h4 className="text-xs font-bold text-teal-950">
                    {language === "hi"
                      ? "अनुशंसित खिड़की खोलने का समय (कक्षा अंतराल / ब्रेक)"
                      : "Target Window Airing Intervals (Lesson Breaks)"}
                  </h4>
                </div>

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
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-teal-300/80 text-teal-950 text-xs font-bold shadow-2xs"
                        >
                          <span className="text-[10px] uppercase font-mono text-teal-700 bg-teal-50 px-1 py-0.2 rounded font-extrabold">
                            Break {idx + 1}
                          </span>
                          <Wind className="w-3 h-3 text-teal-600" />
                          <span className="font-mono">
                            {formatTime(win.start)} – {formatTime(win.end)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-teal-900 italic font-medium">
                    {language === "hi"
                      ? "बाहरी प्रदूषण अधिक होने के कारण खिड़कियाँ बंद रखने की सिफारिश है।"
                      : "No window opening scheduled. Keep windows closed due to elevated outdoor particulate levels."}
                  </p>
                )}
              </div>

              {/* Warnings */}
              {ventilation.warnings && ventilation.warnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {language === "hi" ? "संवातन सावधानी सूचना" : "Ventilation Advisory Notice"}
                    </p>
                    <p className="mt-0.5 text-amber-800">{ventilation.warnings.join(" ")}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hourly Air Quality & Ventilation Chart */}
      {chartData.length > 0 && (
        <Card className="rounded-2xl border border-border shadow-card">
          <CardHeader className="p-5 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base font-bold text-card-foreground">
                {language === "hi"
                  ? "प्रति घंटा वायु गुणवत्ता पूर्वानुमान"
                  : "Hourly Forecast & Ambient Trends"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">
                {language === "hi"
                  ? "Copernicus CAMS Global मॉडल का 48-घंटे का वायु पूर्वानुमान"
                  : "CAMS Global 48-hour PM2.5, PM10 & U.S. AQI reference trend"}
              </CardDescription>
            </div>

            <div>
              <Tabs value={chartViewMode} onValueChange={(val) => setChartViewMode(val as "chart" | "table")}>
                <TabsList className="h-8 p-0.5 bg-muted">
                  <TabsTrigger value="chart" className="text-xs font-bold px-3 py-1 gap-1.5 h-7">
                    <ChartIcon className="w-3.5 h-3.5" />
                    <span>Chart</span>
                  </TabsTrigger>
                  <TabsTrigger value="table" className="text-xs font-bold px-3 py-1 gap-1.5 h-7">
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            {chartViewMode === "chart" ? (
              <div>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        stroke="#cbd5e1"
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        stroke="#cbd5e1"
                        domain={[0, "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08)",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />

                      <Area
                        type="monotone"
                        dataKey="pm25"
                        name="PM2.5 (µg/m³)"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#pm25Gradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="pm10"
                        name="PM10 (µg/m³)"
                        stroke="#0d9488"
                        strokeWidth={1.8}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="aqi"
                        name="U.S. AQI (Ref)"
                        stroke="#d97706"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5 font-medium">
                  <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Provenance Disclosure:</strong> CAMS Global atmospheric model (~45 km grid resolution; API interpolates hourly rows). This is a regional model forecast, not an on-site monitor.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-muted-foreground font-bold sticky top-0">
                      <th className="py-2.5 px-3">Local Time</th>
                      <th className="py-2.5 px-3">PM2.5 (µg/m³)</th>
                      <th className="py-2.5 px-3">PM10 (µg/m³)</th>
                      <th className="py-2.5 px-3">U.S. AQI (Ref)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-xs">
                    {chartData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/40">
                        <td className="py-2 px-3 font-sans font-medium text-card-foreground">{row.time}</td>
                        <td className="py-2 px-3 text-blue-700 font-bold">{row.pm25 ?? "—"}</td>
                        <td className="py-2 px-3 text-teal-700">{row.pm10 ?? "—"}</td>
                        <td className="py-2 px-3 text-amber-700">{row.aqi ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Physics & Assumptions Accordion */}
      <Card className="rounded-2xl border border-border shadow-card p-5">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="physics" className="border-b-0">
            <AccordionTrigger className="text-xs font-bold text-blue-900 hover:text-blue-950 py-1 hover:no-underline">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                <span>
                  {language === "hi"
                    ? "भौतिक मॉडल (Mass Balance) और उद्धृत वैज्ञानिक स्रोत देखें"
                    : "View Mass-Balance Physics & Scientific Sources"}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="mt-3 pt-2 text-xs text-muted-foreground space-y-3">
              <div>
                <span className="font-bold text-foreground block mb-1 font-mono uppercase text-[10px] text-muted-foreground">
                  Single-Zone Analytic Mass-Balance Formulation
                </span>
                <div className="bg-slate-950 text-slate-100 p-3.5 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed font-semibold shadow-inner">
                  <span className="text-blue-400">PM2.5:</span> dC/dt = λ · P · Cout - (λ + k) · C<br />
                  <span className="text-teal-400">CO₂:</span> dC/dt = G / V + λ · (Cout - C)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-muted/40 p-3 rounded-xl border border-border">
                  <span className="font-bold text-foreground">Deposition Rate (k):</span>{" "}
                  0.39 h⁻¹ (U.S. EPA Exposure Factors Handbook, Table 19-6)
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border">
                  <span className="font-bold text-foreground">CO₂ Baseline:</span>{" "}
                  426 ppm (ASHRAE 2024 global outdoor baseline)
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border">
                  <span className="font-bold text-foreground">CO₂ Generation (G):</span>{" "}
                  0.31 L/min/person (ASHRAE Standard 62.1 Addendum d)
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border">
                  <span className="font-bold text-foreground">Airflow Rate:</span>{" "}
                  {typeof inputs.airflowBasis === "string"
                    ? inputs.airflowBasis
                    : "Estover Community College UK Study (0.5 ACH closed, 5.0 ACH open)"}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground italic pt-2 border-t border-border">
                Model estimates are physical approximations and do not replace on-site carbon dioxide sensors or local fire, acoustic, and thermal guidelines.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
