"use client"

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { cn } from "@/lib/utils"

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getReducedMotionServerSnapshot() {
  return false
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
}

function useTween(target: number[], duration = 700, reduceMotion = false) {
  const [current, setCurrent] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    if (reduceMotion) {
      setCurrent(target)
      fromRef.current = target
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = target.map((to, i) => {
        const f = from[i] ?? to
        return f + (to - f) * eased
      })
      setCurrent(next)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduceMotion])

  return current
}

type AreaChartProps = {
  data: number[]
  labels?: string[]
  height?: number
  className?: string
  formatValue?: (n: number) => string
}

export function AreaChart({
  data,
  labels,
  height = 220,
  className,
  formatValue = (n) => Math.round(n).toLocaleString(),
}: AreaChartProps) {
  const reduceMotion = usePrefersReducedMotion()
  const tweened = useTween(data, 700, reduceMotion)
  const [hover, setHover] = useState<number | null>(null)
  const w = 800
  const h = height
  const padX = 12
  const padY = 18

  const max = Math.max(...tweened, 1) * 1.15
  const min = 0
  const range = max - min || 1
  const step = (w - padX * 2) / Math.max(1, tweened.length - 1)

  const points = tweened.map(
    (v, i) => [padX + i * step, h - padY - ((v - min) / range) * (h - padY * 2)] as const,
  )

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ")
  const areaPath = `${linePath} L ${(w - padX).toFixed(2)} ${(h - padY).toFixed(2)} L ${padX} ${(h - padY).toFixed(2)} Z`

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * w
    const idx = Math.round((x - padX) / step)
    if (idx >= 0 && idx < points.length) setHover(idx)
  }

  const hoverPoint = hover !== null ? points[hover] : null
  const hoverValue = hover !== null ? tweened[hover] : null
  const hoverLabel = hover !== null ? labels?.[hover] : null

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="dashboard-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={padX}
            x2={w - padX}
            y1={padY + (h - padY * 2) * p}
            y2={padY + (h - padY * 2) * p}
            className="stroke-border"
            strokeDasharray="3 4"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill="url(#dashboard-area-grad)" className="text-primary" />
        <path
          d={linePath}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="text-primary stroke-current"
        />

        {hoverPoint && (
          <g>
            <line
              x1={hoverPoint[0]}
              x2={hoverPoint[0]}
              y1={padY}
              y2={h - padY}
              className="stroke-foreground/40"
              strokeDasharray="2 3"
              strokeWidth={1}
            />
            <circle
              cx={hoverPoint[0]}
              cy={hoverPoint[1]}
              r={5}
              className="fill-background stroke-current text-primary"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {hoverPoint && hoverValue !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{
            left: `${(hoverPoint[0] / w) * 100}%`,
            top: `${(hoverPoint[1] / h) * 100}%`,
            marginTop: -8,
          }}
        >
          {hoverLabel && (
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {hoverLabel}
            </div>
          )}
          <div className="font-medium tabular-nums">{formatValue(hoverValue)}</div>
        </div>
      )}
    </div>
  )
}

type BarChartProps = {
  data: number[]
  labels: string[]
  height?: number
  formatValue?: (n: number) => string
  className?: string
}

export function BarChart({
  data,
  labels,
  height = 180,
  formatValue = (n) => Math.round(n).toLocaleString(),
  className,
}: BarChartProps) {
  const reduceMotion = usePrefersReducedMotion()
  const tweened = useTween(data, 600, reduceMotion)
  const max = Math.max(...tweened, 1) * 1.1

  return (
    <div className={cn("flex w-full items-end gap-1.5", className)} style={{ height }}>
      {tweened.map((v, i) => {
        const pct = (v / max) * 100
        return (
          <div
            key={i}
            className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <div className="relative flex w-full flex-1 items-end">
              <div
                className="w-full origin-bottom rounded-t-md bg-primary/70 transition-all duration-300 group-hover:bg-primary"
                style={{ height: `${pct}%` }}
              />
              <div
                className={cn(
                  "pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100",
                )}
                style={{ bottom: `calc(${pct}% + 8px)` }}
              >
                {formatValue(v)}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

type DonutSegment = {
  label: string
  value: number
  className: string
}

type DonutChartProps = {
  data: DonutSegment[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
  className?: string
}

export function DonutChart({
  data,
  size = 200,
  thickness = 22,
  centerLabel = "Total",
  centerValue,
  className,
}: DonutChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  const segments = useMemo(
    () =>
      data.reduce<{ dash: number; dashOffset: number }[]>((acc, d) => {
        const portion = total > 0 ? d.value / total : 0
        const dash = portion * c
        const prevOffset = acc[acc.length - 1]
        const dashOffset = prevOffset
          ? prevOffset.dashOffset - prevOffset.dash
          : 0
        acc.push({ dash, dashOffset })
        return acc
      }, []),
    [data, total, c],
  )

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={thickness}
            className="stroke-muted/40"
          />
          {data.map((d, i) => {
            const { dash, dashOffset } = segments[i]
            const isActive = active === i
            const styleVar = {
              ["--seg-dash"]: `${dash} ${c - dash}`,
            } as CSSProperties
            return (
              <circle
                key={d.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                strokeWidth={isActive ? thickness + 4 : thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                className={cn(
                  "stroke-current cursor-pointer transition-all duration-500",
                  d.className,
                  active !== null && !isActive && "opacity-30",
                )}
                style={styleVar}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              />
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-heading text-2xl font-medium tabular-nums">
            {active !== null ? data[active].value.toLocaleString() : centerValue ?? total.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            {active !== null ? data[active].label : centerLabel}
          </span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {data.map((d, i) => {
          const portion = total > 0 ? (d.value / total) * 100 : 0
          return (
            <li
              key={d.label}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition-colors",
                active === i ? "bg-muted/60" : "hover:bg-muted/40",
              )}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className={cn("size-2 rounded-full bg-current", d.className)} />
                <span className="truncate text-muted-foreground">{d.label}</span>
              </span>
              <span className="tabular-nums">{portion.toFixed(0)}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
