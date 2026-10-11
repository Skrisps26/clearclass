"use client";

import { useState } from "react";
import { AlertCircle, Layers, LineChart as ChartIcon, Table as TableIcon } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Ventilation, AirHour } from "../types/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VentilationTabProps {
  ventilation: Ventilation;
  hourly: AirHour[];
  timezone?: string;
  language: "en" | "hi";
}

export function VentilationTab({
  ventilation,
  hourly,
  timezone,
  language,
}: VentilationTabProps) {
  const [chartViewMode, setChartViewMode] = useState<"chart" | "table">("chart");

  const isEstimated = ventilation.status === "estimated";
  const schedule = (ventilation.schedule || {}) as Record<string, unknown>;
  const summary = (ventilation.summary || {}) as Record<string, unknown>;
  const inputs = (ventilation.inputs || {}) as Record<string, unknown>;
  const windows = ventilation.flushWindows || [];
  const co2Feasible = ventilation.co2Feasible ?? summary.co2Feasible;
  const displayTimezone = timezone || ventilation.timezone || undefined;
  const openingAllowed = schedule.openingAllowed === true;
  const scheduleName = openingAllowed
    ? language === "hi" ? "प्रति घंटा खिड़की खोलने की योजना" : "Hourly airing plan"
    : language === "hi" ? "खिड़कियाँ बंद रखने की योजना" : "Closed-window plan";

  const maxCo2 = typeof summary.maxEstimatedIndoorCo2Ppm === "number" ? Math.round(summary.maxEstimatedIndoorCo2Ppm) : null;
  const maxPm25 = typeof summary.maxEstimatedIndoorPm25UgM3 === "number" ? Math.round(summary.maxEstimatedIndoorPm25UgM3) : null;
  const integratedPm = typeof summary.integratedIndoorPm25UgHourM3 === "number" ? Math.round(summary.integratedIndoorPm25UgHourM3) : null;

  const formatTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: displayTimezone,
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const chartData = (hourly || []).map((hour) => ({
    time: formatTime(hour.localTime || hour.time),
    pm25: hour.pm25 !== null && hour.pm25 !== undefined ? Math.round(hour.pm25) : null,
    pm10: hour.pm10 !== null && hour.pm10 !== undefined ? Math.round(hour.pm10) : null,
    aqi: hour.referenceAqi !== null && hour.referenceAqi !== undefined ? hour.referenceAqi : null,
  }));

  const modelEstimate = ventilation.estimateLabel || (language === "hi" ? "मॉडल अनुमान" : "Model estimate");
  const co2Summary = co2Feasible === true
    ? language === "hi" ? "CO₂ मानक पूरा (सुरक्षित)" : "CO₂ safe benchmark met"
    : co2Feasible === false
      ? language === "hi" ? "CO₂ सीमा से अधिक" : "CO₂ benchmark exceeded"
      : language === "hi" ? "CO₂ व्यवहार्यता उपलब्ध नहीं है" : "CO₂ feasibility unavailable";

  const assumptions = Object.entries(ventilation.assumptions || {});
  const formatAssumption = (value: unknown) => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  return (
    <section aria-labelledby="ventilation-title" className="min-w-0 border-y bg-card">
      <div className="border-b px-4 py-3 sm:px-6">
        <h2 id="ventilation-title" className="text-lg font-semibold">
          {language === "hi" ? "कक्षा संवातन रणनीति" : "Classroom ventilation schedule"}
        </h2>
        <p className="mt-1 max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
          {language === "hi"
            ? "भीतरी CO₂ जमाव को कम करते हुए PM2.5 जोखिम को न्यूनतम रखने का गणितीय मॉडल"
            : "Physical mass-balance model balancing indoor CO₂ accumulation against outdoor PM2.5."}
        </p>
      </div>

      {!isEstimated ? (
        <div className="px-4 py-5 sm:px-6">
          <p className="text-base font-semibold">
            {language === "hi" ? "संवातन पूर्वानुमान उपलब्ध नहीं है" : "Ventilation forecast unavailable"}
          </p>
          <p className="mt-1 max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
            {ventilation.reason ||
              (language === "hi"
                ? "स्थान का सटीक प्रति घंटा वायु गुणवत्ता डेटा न होने के कारण खिड़की खोलने की अवधि की गणना नहीं की जा सकी।"
                : "Requires complete hourly PM2.5 forecast for school hours.")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 px-4 py-4 sm:px-6">
            <div className="border-b border-border pb-4">
              <p className="text-base font-semibold">
                {language === "hi" ? "आज की खिड़की योजना" : "Today’s window plan"}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-foreground">
                <span className="font-medium">{scheduleName}.</span>{" "}
                {openingAllowed
                  ? language === "hi" ? "हर घंटे 10 मिनट के लिए खिड़कियाँ खोलें।" : "Open windows for a 10-minute flush each hour."
                  : language === "hi" ? "खिड़कियाँ बंद रखें।" : "Keep windows closed."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{language === "hi" ? "मॉडल अनुमान:" : "Model estimate:"}</span>{" "}
                {modelEstimate} · {co2Summary}
              </p>
            </div>

            <div className="border-b border-border pb-4">
              <h3 className="text-base font-semibold">
                {language === "hi" ? "अनुशंसित खिड़की खोलने का समय" : "Recommended window airing times"}
              </h3>
              {windows.length > 0 ? (
                <ol className="mt-2 divide-y border-y">
                  {windows.map((window, index) => (
                    <li key={`${window.start}-${window.end}-${index}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 text-[15px]">
                      <span className="font-medium">
                        {language === "hi" ? `विराम ${index + 1}` : `Break ${index + 1}`}
                      </span>
                      <time className="font-mono text-sm tabular-nums text-muted-foreground">
                        {formatTime(window.start)} – {formatTime(window.end)}
                      </time>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {language === "hi"
                    ? "बाहरी प्रदूषण अधिक होने के कारण खिड़कियाँ बंद रखने की सिफारिश है।"
                    : "No window opening scheduled. Keep windows closed due to elevated outdoor particulate levels."}
                </p>
              )}
            </div>

            <dl className="divide-y border-y">
              <div className="grid gap-1 py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)] sm:gap-4">
                <dt className="text-sm text-muted-foreground">
                  {language === "hi" ? "अधिकतम अनुमानित CO₂" : "Peak indoor CO₂"}
                </dt>
                <dd className="font-mono text-[15px] font-semibold tabular-nums">
                  {maxCo2 !== null ? `${maxCo2} ppm` : "—"}
                  <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">UK DfE benchmark: &lt;1,500 ppm</span>
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)] sm:gap-4">
                <dt className="text-sm text-muted-foreground">
                  {language === "hi" ? "अधिकतम भीतरी PM2.5" : "Peak indoor PM2.5"}
                </dt>
                <dd className="font-mono text-[15px] font-semibold tabular-nums">
                  {maxPm25 !== null ? `${maxPm25} µg/m³` : "—"}
                  <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                    {language === "hi" ? "अंतःप्रवेश अनुमान" : "Infiltration estimate"}
                  </span>
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)] sm:gap-4">
                <dt className="text-sm text-muted-foreground">
                  {language === "hi" ? "कुल संचित PM2.5" : "Integrated PM2.5"}
                </dt>
                <dd className="font-mono text-[15px] font-semibold tabular-nums">
                  {integratedPm !== null ? `${integratedPm} µg·h/m³` : "—"}
                  <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">08:00 – 14:30 school day</span>
                </dd>
              </div>
            </dl>

            {ventilation.warnings && ventilation.warnings.length > 0 && (
              <div className="flex items-start gap-2 bg-status-modify px-3 py-2.5 text-sm text-status-modify-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    {language === "hi" ? "संवातन सावधानी सूचना" : "Ventilation advisory notice"}
                  </p>
                  <p className="mt-0.5 leading-relaxed">{ventilation.warnings.join(" ")}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {chartData.length > 0 && (
        <div className="border-t">
          <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h3 className="text-base font-semibold">
                {language === "hi" ? "प्रति घंटा वायु गुणवत्ता पूर्वानुमान" : "Hourly forecast and ambient trends"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {language === "hi"
                  ? "CAMS Global मॉडल का 48-घंटे का वायु पूर्वानुमान"
                  : "CAMS Global 48-hour PM2.5, PM10 and U.S. AQI reference trend"}
                {displayTimezone && <span className="ml-1">· {displayTimezone}</span>}
              </p>
            </div>
            <Tabs value={chartViewMode} onValueChange={(value) => setChartViewMode(value as "chart" | "table")}>
              <TabsList className="h-9 bg-muted p-0.5">
                <TabsTrigger value="chart" className="h-8 gap-1.5 px-3 text-sm font-medium">
                  <ChartIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{language === "hi" ? "चार्ट" : "Chart"}</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="h-8 gap-1.5 px-3 text-sm font-medium">
                  <TableIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{language === "hi" ? "तालिका" : "Table"}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="min-w-0 px-4 py-4 sm:px-6">
            {chartViewMode === "chart" ? (
              <div>
                <div className="h-64 w-full sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="#d5dee3" vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12, fill: "#475866" }}
                        stroke="#d5dee3"
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="pm"
                        width={38}
                        tick={{ fontSize: 11, fill: "#475866" }}
                        stroke="#d5dee3"
                        domain={[0, "auto"]}
                        label={{ value: "µg/m³", angle: -90, position: "insideLeft", fontSize: 10, fill: "#475866" }}
                      />
                      <YAxis
                        yAxisId="aqi"
                        orientation="right"
                        width={35}
                        tick={{ fontSize: 11, fill: "#86520e" }}
                        stroke="#d5dee3"
                        domain={[0, "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "6px",
                          border: "1px solid #d5dee3",
                          fontSize: "13px",
                        }}
                        labelStyle={{ fontWeight: 600, color: "#17212b" }}
                        cursor={{ stroke: "#d5dee3" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Area
                        type="monotone"
                        dataKey="pm25"
                        yAxisId="pm"
                        name="PM2.5 (µg/m³)"
                        stroke="#245a73"
                        strokeWidth={2}
                        fill="#dbeaf0"
                        fillOpacity={0.8}
                      />
                      <Line
                        type="monotone"
                        dataKey="pm10"
                        yAxisId="pm"
                        name="PM10 (µg/m³)"
                        stroke="#176448"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="aqi"
                        yAxisId="aqi"
                        name="U.S. AQI (Ref)"
                        stroke="#86520e"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Forecast source:</span> CAMS Global atmospheric model (~45 km grid resolution; API interpolates hourly rows). This is a regional model forecast, not an on-site monitor.
                </p>
              </div>
            ) : (
              <div className="max-h-72 min-w-0 overflow-auto">
                <Table className="min-w-[34rem] text-sm">
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="h-10 px-3 font-semibold">Local time</TableHead>
                      <TableHead className="h-10 px-3 font-semibold">PM2.5 (µg/m³)</TableHead>
                      <TableHead className="h-10 px-3 font-semibold">PM10 (µg/m³)</TableHead>
                      <TableHead className="h-10 px-3 font-semibold">U.S. AQI (Ref)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-mono tabular-nums">
                    {chartData.map((row, index) => (
                      <TableRow key={`${row.time}-${index}`}>
                        <TableCell className="px-3 py-2 font-sans font-medium text-foreground">{row.time}</TableCell>
                        <TableCell className="px-3 py-2">{row.pm25 ?? "—"}</TableCell>
                        <TableCell className="px-3 py-2">{row.pm10 ?? "—"}</TableCell>
                        <TableCell className="px-3 py-2">{row.aqi ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t px-4 py-3 sm:px-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="physics" className="border-b-0">
            <AccordionTrigger className="w-fit gap-2 py-1 text-sm font-medium text-primary hover:no-underline hover:underline">
              <Layers className="h-4 w-4" aria-hidden="true" />
              {language === "hi"
                ? "भौतिक मॉडल (Mass Balance) और उद्धृत वैज्ञानिक स्रोत देखें"
                : "View mass-balance physics and scientific sources"}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-2 pt-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Single-Zone Analytic Mass-Balance Formulation</p>
                <div className="mt-2 space-y-1 border bg-muted px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
                  <p>PM2.5: dC/dt = λ · P · Cout - (λ + k) · C</p>
                  <p>CO₂: dC/dt = G / V + λ · (Cout - C)</p>
                </div>
              </div>

              <dl className="divide-y border-y">
                <div className="grid gap-1 py-2 sm:grid-cols-[minmax(11rem,1fr)_minmax(0,2fr)] sm:gap-4">
                  <dt className="font-medium text-foreground">Deposition Rate (k)</dt>
                  <dd>0.39 h⁻¹ (U.S. EPA Exposure Factors Handbook, Table 19-6)</dd>
                </div>
                <div className="grid gap-1 py-2 sm:grid-cols-[minmax(11rem,1fr)_minmax(0,2fr)] sm:gap-4">
                  <dt className="font-medium text-foreground">CO₂ Baseline</dt>
                  <dd>426 ppm (ASHRAE 2024 global outdoor baseline)</dd>
                </div>
                <div className="grid gap-1 py-2 sm:grid-cols-[minmax(11rem,1fr)_minmax(0,2fr)] sm:gap-4">
                  <dt className="font-medium text-foreground">CO₂ Generation (G)</dt>
                  <dd>0.31 L/min/person (ASHRAE Standard 62.1 Addendum d)</dd>
                </div>
                <div className="grid gap-1 py-2 sm:grid-cols-[minmax(11rem,1fr)_minmax(0,2fr)] sm:gap-4">
                  <dt className="font-medium text-foreground">Airflow Rate</dt>
                  <dd>{typeof inputs.airflowBasis === "string" ? inputs.airflowBasis : "Estover Community College UK Study (0.5 ACH closed, 5.0 ACH open)"}</dd>
                </div>
                {assumptions.map(([name, value]) => (
                  <div key={name} className="grid gap-1 py-2 sm:grid-cols-[minmax(11rem,1fr)_minmax(0,2fr)] sm:gap-4">
                    <dt className="font-medium text-foreground">{name}</dt>
                    <dd className="break-words">{formatAssumption(value)}</dd>
                  </div>
                ))}
              </dl>

              {ventilation.sources.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{language === "hi" ? "मॉडल स्रोत" : "Model sources"}</p>
                  {ventilation.sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-fit text-primary underline-offset-4 hover:underline"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              )}

              <p className="border-t pt-3 leading-relaxed">
                Model estimates are physical approximations and do not replace on-site carbon dioxide sensors or local fire, acoustic, and thermal guidelines.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
