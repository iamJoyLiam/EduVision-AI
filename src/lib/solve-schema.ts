import { z } from "zod";

// ── Element types ──

const ElementBase = z.object({
  id: z.string(),
  color_intent: z.enum(["primary", "danger", "success", "warning"]).default("primary"),
  label_text: z.string().optional(),
});

const CurveElement = ElementBase.extend({
  type: z.literal("curve"),
  expression: z.string(),
});

const PointElement = ElementBase.extend({
  type: z.literal("point"),
  expression: z.string(), // "[x, y]"
});

const PolygonElement = ElementBase.extend({
  type: z.literal("polygon"),
  expression: z.string(), // "[[x1,y1], [x2,y2], ...]"
});

const SegmentElement = ElementBase.extend({
  type: z.literal("segment"),
  expression: z.string(), // "[[x1,y1], [x2,y2]]"
});

const VectorElement = ElementBase.extend({
  type: z.literal("vector"),
  expression: z.string(), // "[ox, oy, dx, dy]"
});

const ElementSchema = z.discriminatedUnion("type", [
  CurveElement,
  PointElement,
  PolygonElement,
  SegmentElement,
  VectorElement,
]);

// ── Controls ──

const ControlSchema = z.object({
  symbol: z.string(),
  label: z.string(),
  type: z.literal("slider").default("slider"),
  min: z.number(),
  max: z.number(),
  step: z.number(),
  default: z.number(),
});

// ── Viewport ──

const ViewportSchema = z.object({
  x_min: z.number(),
  x_max: z.number(),
  y_min: z.number(),
  y_max: z.number(),
});

// ── Visualization config ──

const VisualizationConfigSchema = z.object({
  viewport: ViewportSchema,
  controls: z.array(ControlSchema),
  elements: z.array(ElementSchema),
});

// ── Top-level response ──

export const SolveResponseSchema = z.object({
  is_visualizable: z.boolean(),
  subject: z.enum(["MATH", "PHYSICS", "CHEMISTRY"]),
  category: z.enum([
    "MATH_FUNCTION",
    "MATH_GEOMETRY",
    "PHYSICS_KINEMATICS",
    "PHYSICS_MECHANICS",
    "CHEMISTRY_KINETICS",
    "NONE",
  ]),
  analysis_steps: z.array(z.string()),
  visualization_config: VisualizationConfigSchema.nullable(),
});

export type SolveResponse = z.infer<typeof SolveResponseSchema>;
export type VisualizationConfig = z.infer<typeof VisualizationConfigSchema>;
export type Element = z.infer<typeof ElementSchema>;
export type Control = z.infer<typeof ControlSchema>;
export type Viewport = z.infer<typeof ViewportSchema>;
