"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { Activity, Table as TableIcon, LineChart as ChartIcon, Info } from "lucide-react";
import { AirHour, FlushWindow } from "../types/card";

interface ForecastChartProps {
  hourly: AirHour[];
  flushWindows?: FlushWindow[];
  timezone?: string;
  language: "en" | "hi";
}

export function ForecastChart({
  hourly,
  flushWindows = [],
  timezone,
  language,
}: ForecastChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  if (!hourly || hourly.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs">
        {language === "hi"
          ? "इस स्थान के लिए प्रति घंटा पूर्वानुमान डेटा अनुपलब्ध है।"
          : "Hourly forecast data unavailable for this place."}
      </div>
    );
  }

  // Format data for Recharts
  const chartData = hourly.map((h) => {
    let hourLabel = h.time;
    try {
      const d = new Date(h.localTime || h.time);
      hourLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      // fallback
    }

    return {
      time: hourLabel,
      fullTime: h.localTime || h.time,
      pm25: h.pm25 !== null && h.pm25 !== undefined ? Math.round(h.pm25) : null,
      pm10: h.pm10 !== null && h.pm10 !== undefined ? Math.round(h.pm10) : null,
      aqi: h.referenceAqi !== null && h.referenceAqi !== undefined ? h.referenceAqi : null,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Chart Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              {language === "hi"
                ? "प्रति घंटा वायु गुणवत्ता पूर्वानुमान (CAMS Global)"
                : "Hourly Air Forecast & Target Ventilation Intervals"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === "hi"
                ? "PM2.5, PM10 (µg/m³) और U.S. AQI संदर्भ रेखा"
                : "PM2.5 / PM10 (µg/m³) concentrations and U.S. AQI reference index"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-300 rounded-lg p-0.5 bg-white text-xs">
            <button
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold ${
                viewMode === "chart"
                  ? "bg-slate-100 text-blue-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ChartIcon className="w-3 h-3" />
              Chart
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold ${
                viewMode === "table"
                  ? "bg-slate-100 text-blue-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3 h-3" />
              Table
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {viewMode === "chart" ? (
          <div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />

                  <Line
                    type="monotone"
                    dataKey="pm25"
                    name="PM2.5 (µg/m³)"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
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
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Provenance & Disclosures:</span> CAMS Global atmospheric model (~45 km source resolution; API interpolates hourly grid points). This is a coarse forecast, not a monitor-grade roadside measurement. U.S. AQI is an external reference scale and must not be treated as official CPCB AQI.
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold sticky top-0">
                  <th className="py-2 px-3">Local Time</th>
                  <th className="py-2 px-3">PM2.5 (µg/m³)</th>
                  <th className="py-2 px-3">PM10 (µg/m³)</th>
                  <th className="py-2 px-3">U.S. AQI (Ref)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-3 font-sans text-slate-800">{row.time}</td>
                    <td className="py-1.5 px-3 text-blue-700 font-bold">{row.pm25 ?? "—"}</td>
                    <td className="py-1.5 px-3 text-teal-700">{row.pm10 ?? "—"}</td>
                    <td className="py-1.5 px-3 text-amber-700">{row.aqi ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
