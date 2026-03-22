import { z } from "zod";

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const SizeSchema = z.object({
  w: z.number(),
  h: z.number(),
});

export const StyleSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  dashed: z.boolean().optional(),
});

export const TextSchema = z.object({
  content: z.string(),
  fill: z.string().optional(),
  size: z.number().optional(),
});

export const BehaviorSchema = z.object({
  type: z.enum(["oscillate", "pulse", "bounce", "flow_particles"]),
  property: z.string().optional(),
  amplitude: z.number().optional(),
  frequency: z.number().optional(),
  speed: z.number().optional(),
  color: z.string().optional(),
});

export const EntitySchema = z.object({
  id: z.string(),
  type: z.enum(["rectangle", "circle", "line", "text"]),
  position: PositionSchema.optional(),
  size: SizeSchema.optional(),
  from: z.string().optional(), // For lines
  to: z.string().optional(), // For lines
  style: StyleSchema.optional(),
  text: TextSchema.optional(),
  behaviors: z.array(BehaviorSchema).optional(),
});

export const CanvasSchema = z.object({
  background: z.string(),
  width: z.number(),
  height: z.number(),
});

export const SceneSpecSchema = z.object({
  canvas: CanvasSchema,
  entities: z.array(EntitySchema),
});

export type SceneSpec = z.infer<typeof SceneSpecSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type Behavior = z.infer<typeof BehaviorSchema>;
