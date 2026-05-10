"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import {
  DownloadIcon as Download,
  FilmReelIcon as FilmReel,
  PlayCircleIcon as PlayCircle,
  SpinnerGapIcon as Spinner,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  RECAP_DURATION_FRAMES,
  RECAP_FPS,
  RECAP_HEIGHT,
  RECAP_WIDTH,
  WeeklyRecap,
} from "@/remotion/WeeklyRecap"
import type { RecapInput } from "@/remotion/recap-data"

const RecapComponent = WeeklyRecap as unknown as React.ComponentType<
  Record<string, unknown>
>

const Player = dynamic(
  () => import("@remotion/player").then((mod) => mod.Player),
  { ssr: false },
)

type RecapCardProps = {
  data: RecapInput
  className?: string
}

export function RecapCard({ data, className }: RecapCardProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const res = await fetch("/api/recap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Render failed (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `recap-${data.rangeLabel.toLowerCase().replace(/\s+/g, "-")}.mp4`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardDescription className="text-xs uppercase tracking-wide">
            Recap video
          </CardDescription>
          <CardTitle className="font-heading text-base">
            Animated summary
          </CardTitle>
        </div>
        <Badge variant="outline" className="gap-1">
          <FilmReel className="size-3" weight="bold" />
          Remotion
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-lg border border-border bg-black">
          <Player
            component={RecapComponent}
            inputProps={data as unknown as Record<string, unknown>}
            durationInFrames={RECAP_DURATION_FRAMES}
            fps={RECAP_FPS}
            compositionWidth={RECAP_WIDTH}
            compositionHeight={RECAP_HEIGHT}
            style={{ width: "100%", aspectRatio: `${RECAP_WIDTH} / ${RECAP_HEIGHT}` }}
            controls
            autoPlay
            loop
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Same composition is rendered server-side to MP4 on export.
          </p>
          <Button size="sm" onClick={onExport} disabled={exporting}>
            {exporting ? (
              <>
                <Spinner className="size-3.5 animate-spin" />
                Rendering…
              </>
            ) : (
              <>
                <Download className="size-3.5" />
                Download MP4
              </>
            )}
          </Button>
        </div>
        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-2">
            <p className="min-w-0 flex-1 text-[11px] text-destructive">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 border-destructive/40"
              onClick={onExport}
              disabled={exporting}
            >
              Try again
            </Button>
          </div>
        ) : null}
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <PlayCircle className="size-3" />
          First export downloads headless Chromium (~90&nbsp;MB) and may take 10–20&nbsp;s.
        </p>
      </CardContent>
    </Card>
  )
}
