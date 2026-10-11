import { z } from "zod";

export const CoordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const CardLocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  coordinates: CoordinatesSchema,
  country: z.string(),
  timezone: z.string(),
  admin1: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
});

export const ReferenceAqiSchema = z.object({
  scheme: z.string(),
  value: z.number(),
  provider: z.string(),
  modelled: z.boolean(),
});

export const AuthoritativeLocalAqiSchema = z
  .object({
    scheme: z.string(),
    value: z.number(),
    provider: z.string(),
    issuedAt: z.string().nullable().optional(),
    sourceUrl: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

export const AirHourSchema = z.object({
  time: z.string(),
  localTime: z.string().nullable().optional(),
  pm25: z.number().nullable().optional(),
  pm10: z.number().nullable().optional(),
  referenceAqi: z.number().nullable().optional(),
});

export const AirDataSchema = z.object({
  status: z.enum(["synthetic", "cached", "cached_stale", "modelled", "unavailable"]),
  referenceAqi: ReferenceAqiSchema.nullable().optional(),
  authoritativeLocalAqi: AuthoritativeLocalAqiSchema,
  grid: CoordinatesSchema.nullable().optional(),
  domain: z.string().nullable().optional(),
  sourceResolution: z.string().nullable().optional(),
  ageMinutes: z.number().nullable().optional(),
  stale: z.boolean(),
  hourly: z.array(AirHourSchema),
  message: z.string().nullable().optional(),
});

export const EvidenceSourceSchema = z.object({
  id: z.string(),
  publisher: z.string().nullable().optional(),
  title: z.string(),
  url: z.string(),
  issued: z.string().nullable().optional(),
  accessed: z.string().nullable().optional(),
  pages: z.string().nullable().optional(),
  classification: z.string(),
  notes: z.string().nullable().optional(),
});

export const VerdictSchema = z.object({
  activity: z.string(),
  cohort: z.string(),
  decision: z.enum(["allow", "modify", "deny"]),
  status: z.enum(["evaluated", "insufficient_data", "stale", "unavailable"]),
  selectedAction: z.string().nullable().optional(),
  ruleIds: z.array(z.string()).default([]),
  sources: z.array(EvidenceSourceSchema).default([]),
  referenceAqiInput: ReferenceAqiSchema.nullable().optional(),
  forecastValidTimes: z.array(z.string()).default([]),
  inputDescription: z.string().nullable().optional(),
  basis: z.string().nullable().optional(),
  policySetVersion: z.string().nullable().optional(),
  modifications: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  sensitivePupilCaveat: z.string().nullable().optional(),
  indoorAirCaveat: z.string().nullable().optional(),
  sourceTime: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
});

export const FlushWindowSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const VentilationStepSchema = z.object({
  start: z.string(),
  outdoorPm25UgM3: z.number(),
  windowsOpen: z.boolean(),
  airChangesPerHour: z.number(),
  estimatedIndoorPm25UgM3: z.number(),
  estimatedIndoorCo2Ppm: z.number(),
});

export const VentilationSchema = z.object({
  status: z.enum(["estimated", "unavailable"]),
  estimateLabel: z.string(),
  reason: z.string().nullable().optional(),
  modelVersion: z.string().nullable().optional(),
  assumptions: z.record(z.unknown()).default({}),
  sources: z.array(EvidenceSourceSchema).default([]),
  locationId: z.number().nullable().optional(),
  localDate: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  schoolDay: FlushWindowSchema.nullable().optional(),
  inputs: z.record(z.unknown()).default({}),
  schedule: z.record(z.unknown()).default({}),
  summary: z.record(z.unknown()).default({}),
  steps: z.array(VentilationStepSchema).default([]),
  flushWindows: z.array(FlushWindowSchema).default([]),
  co2Feasible: z.boolean().nullable().optional(),
  warnings: z.array(z.string()).default([]),
});

export const ParentMessageSchema = z.object({
  en: z.string(),
  hi: z.string(),
});

export const DailyCardSchema = z.object({
  schoolId: z.string(),
  date: z.string(),
  generatedAt: z.string(),
  dataSource: z.string(),
  dataAsOf: z.string().nullable().optional(),
  location: CardLocationSchema,
  scenarioId: z.string().nullable().optional(),
  policySetVersion: z.string().nullable().optional(),
  regulatoryCoverage: z.enum(["reference_only", "verified_local", "local_status_unknown"]),
  officialStage: z.unknown().nullable().optional(),
  officialStageStatus: z.enum(["current", "unknown", "stale", "unavailable"]),
  air: AirDataSchema,
  policySources: z.array(EvidenceSourceSchema).default([]),
  verdicts: z.array(VerdictSchema).default([]),
  ventilation: VentilationSchema,
  parentMessage: ParentMessageSchema,
});

export type DailyCard = z.infer<typeof DailyCardSchema>;
export type Verdict = z.infer<typeof VerdictSchema>;
export type AirHour = z.infer<typeof AirHourSchema>;
export type Ventilation = z.infer<typeof VentilationSchema>;
export type FlushWindow = z.infer<typeof FlushWindowSchema>;
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;
export type CardLocation = z.infer<typeof CardLocationSchema>;
export type ReferenceAqi = z.infer<typeof ReferenceAqiSchema>;
export type ParentMessage = z.infer<typeof ParentMessageSchema>;

export interface SchoolTemplate {
  id: string;
  name: string;
  defaultLocationId: number;
}
