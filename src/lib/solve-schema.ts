import { z } from "zod";

const VisualizationSchema = z.object({
  type: z.enum(["function", "geometry", "inequality"]),
  expressions: z.array(
    z.object({
      expr: z.string(),
      label: z.string(),
      color: z.string(),
    }),
  ),
  variables: z.array(
    z.object({
      name: z.string(),
      min: z.number(),
      max: z.number(),
      default: z.number(),
      step: z.number(),
    }),
  ),
  xRange: z.tuple([z.number(), z.number()]),
  yRange: z.tuple([z.number(), z.number()]),
});

export const SolveResponseSchema = z.object({
  steps: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
      formula: z.string().optional(),
    }),
  ),
  visualization: VisualizationSchema.nullable(),
});

export type SolveResponse = z.infer<typeof SolveResponseSchema>;
export type VisualizationConfig = z.infer<typeof VisualizationSchema>;
