import { z } from "zod";

const controlCharacters = /[\u0000-\u001F\u007F]/;

const citySchema = z.enum([
  "Salvador",
  "Camaçari",
  "Lauro de Freitas",
  "Simões Filho",
]);

const issueTypeSchema = z.enum([
  "heat_island",
  "low_tree_cover",
  "exposed_transit_stop",
  "paved_open_area",
  "school_route",
]);

const heatLevelSchema = z.enum(["low", "medium", "high", "extreme"]);
const shadeLevelSchema = z.enum(["good", "moderate", "low", "none"]);
const prioritySchema = z.enum(["low", "medium", "high", "critical"]);

const textWithoutControlCharacters = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !controlCharacters.test(value), {
      message: "O texto contém caracteres inválidos.",
    });

export const pointSubmissionSchema = z.object({
  city: citySchema,
  neighborhood: textWithoutControlCharacters(2, 80),
  issueType: issueTypeSchema,
  heatLevel: heatLevelSchema,
  shadeLevel: shadeLevelSchema,
  priority: prioritySchema.optional(),
  description: textWithoutControlCharacters(10, 500),
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  aiAssisted: z.boolean().optional(),
  ref: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-z0-9_-]+$/i, {
      message: "Referência inválida.",
    })
    .optional(),
});

export type PointSubmission = z.infer<typeof pointSubmissionSchema>;
