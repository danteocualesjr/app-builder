import { z } from "zod"

export const recapInputSchema = z.object({
  rangeLabel: z.string(),
  totalRevenue: z.number(),
  revenueDelta: z.number(),
  activeUsers: z.number(),
  conversion: z.number(),
  bestDay: z.object({
    label: z.string(),
    value: z.number(),
  }),
  revenueSeries: z.array(z.number()),
  channels: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      color: z.string(),
    }),
  ),
  generatedAt: z.string(),
})

export type RecapInput = z.infer<typeof recapInputSchema>

export const RECAP_FALLBACK: RecapInput = {
  rangeLabel: "Last 30 days",
  totalRevenue: 128_400,
  revenueDelta: 12.4,
  activeUsers: 2_847,
  conversion: 3.24,
  bestDay: { label: "Wed", value: 412 },
  revenueSeries: [
    3_900, 4_120, 4_280, 4_010, 4_680, 5_020, 4_560, 4_890, 5_240, 5_410, 5_120,
    5_680, 5_940, 5_780, 6_120, 6_310, 6_080, 6_440, 6_710, 6_580, 6_890, 7_120,
    7_010, 7_280, 7_540, 7_410, 7_690, 7_960, 7_840, 8_120,
  ],
  channels: [
    { label: "Direct", value: 2_840, color: "#2563eb" },
    { label: "Search", value: 1_960, color: "#0ea5e9" },
    { label: "Social", value: 1_280, color: "#10b981" },
    { label: "Referral", value: 640, color: "#f59e0b" },
  ],
  generatedAt: new Date(0).toISOString(),
}
