"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowDownIcon as ArrowDown,
  ArrowLeftIcon as ArrowLeft,
  ArrowUpIcon as ArrowUp,
  ChartLineUpIcon as ChartLineUp,
  ClockIcon as Clock,
  CurrencyDollarIcon as CurrencyDollar,
  LightningIcon as Lightning,
  MoonIcon as Moon,
  PulseIcon as Pulse,
  SparkleIcon as Sparkle,
  SunIcon as Sun,
  UsersThreeIcon as UsersThree,
  type Icon as PhosphorIcon,
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
import {
  applyTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme"
import { cn } from "@/lib/utils"

import type { RecapInput } from "@/remotion/recap-data"

import { AnimatedCounter } from "./animated-counter"
import { AreaChart, BarChart, DonutChart } from "./charts"
import { RecapCard } from "./recap-card"

type Range = "7d" | "30d" | "90d"

const RANGE_OPTIONS: { id: Range; label: string; days: number }[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
]

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function generateSeries(seed: number, days: number, base: number, variance: number) {
  const out: number[] = []
  let prev = base
  for (let i = 0; i < days; i++) {
    const noise =
      Math.sin((i + seed) * 0.7) * variance +
      Math.cos((i + seed) * 0.31) * variance * 0.55
    prev = Math.max(
      base * 0.45,
      Math.min(base * 1.7, prev * 0.82 + (base + noise) * 0.18),
    )
    out.push(prev)
  }
  return out
}

function sum(arr: number[]) {
  return arr.reduce((s, n) => s + n, 0)
}

type KpiDef = {
  id: "revenue" | "users" | "conversion" | "session"
  label: string
  icon: PhosphorIcon
  format: (n: number) => string
  derive: (range: Range, days: number) => { value: number; delta: number }
}

const KPIS: KpiDef[] = [
  {
    id: "revenue",
    label: "Revenue",
    icon: CurrencyDollar,
    format: (n) =>
      `$${Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    derive: (_range, days) => {
      const series = generateSeries(11, days, 4_300, 800)
      const total = sum(series)
      const half = days / 2
      const recent = sum(series.slice(Math.floor(half)))
      const prior = sum(series.slice(0, Math.floor(half))) || 1
      return { value: total, delta: ((recent - prior) / prior) * 100 }
    },
  },
  {
    id: "users",
    label: "Active users",
    icon: UsersThree,
    format: (n) => Math.round(n).toLocaleString(),
    derive: (_range, days) => {
      const series = generateSeries(7, days, 950, 180)
      const value = series[series.length - 1]
      const baseline = series[Math.max(0, series.length - 8)] || value
      return { value, delta: ((value - baseline) / baseline) * 100 }
    },
  },
  {
    id: "conversion",
    label: "Conversion",
    icon: Lightning,
    format: (n) => `${n.toFixed(2)}%`,
    derive: (_range, days) => {
      const series = generateSeries(3, days, 3.2, 0.6)
      const value = series[series.length - 1]
      const prev = series[Math.max(0, series.length - 4)] || value
      return { value, delta: ((value - prev) / prev) * 100 }
    },
  },
  {
    id: "session",
    label: "Avg. session",
    icon: Clock,
    format: (n) => {
      const total = Math.max(0, n)
      const m = Math.floor(total / 60)
      const s = Math.round(total % 60)
        .toString()
        .padStart(2, "0")
      return `${m}m ${s}s`
    },
    derive: (_range, days) => {
      const series = generateSeries(17, days, 245, 45)
      const value = series[series.length - 1]
      const prev = series[Math.max(0, series.length - 5)] || value
      return { value, delta: ((value - prev) / prev) * 100 }
    },
  },
]

const ACTIVITY: {
  title: string
  meta: string
  icon: PhosphorIcon
  tone: "success" | "info" | "warning" | "default"
}[] = [
  {
    title: "Plan upgraded to Pro",
    meta: "Sasha · 2m ago",
    icon: Sparkle,
    tone: "success",
  },
  {
    title: "New deployment shipped",
    meta: "build #428 · 6m ago",
    icon: Lightning,
    tone: "info",
  },
  {
    title: "Spike in signups detected",
    meta: "+38% over 1h · 14m ago",
    icon: ChartLineUp,
    tone: "success",
  },
  {
    title: "API latency above target",
    meta: "us-east · 22m ago",
    icon: Pulse,
    tone: "warning",
  },
  {
    title: "Weekly digest sent",
    meta: "1,204 recipients · 1h ago",
    icon: UsersThree,
    tone: "default",
  },
]

const TONE_CLASS: Record<(typeof ACTIVITY)[number]["tone"], string> = {
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  default: "bg-muted text-muted-foreground",
}

function toggleTheme() {
  const next: ThemePreference = document.documentElement.classList.contains(
    "dark",
  )
    ? "light"
    : "dark"
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // ignore
  }
  applyTheme(next)
}

export function Dashboard() {
  const [range, setRange] = useState<Range>("30d")
  const days = RANGE_OPTIONS.find((r) => r.id === range)?.days ?? 30

  const revenueSeries = useMemo(() => generateSeries(11, days, 4_300, 800), [days])
  const dailyActivity = useMemo(() => generateSeries(23, 7, 320, 90), [])

  const channels = useMemo(() => {
    const factor = days / 30
    return [
      {
        label: "Direct",
        value: Math.round(2_840 * factor),
        className: "text-primary",
        color: "#2563eb",
      },
      {
        label: "Search",
        value: Math.round(1_960 * factor),
        className: "text-sky-500",
        color: "#0ea5e9",
      },
      {
        label: "Social",
        value: Math.round(1_280 * factor),
        className: "text-emerald-500",
        color: "#10b981",
      },
      {
        label: "Referral",
        value: Math.round(640 * factor),
        className: "text-amber-500",
        color: "#f59e0b",
      },
    ]
  }, [days])

  const kpis = useMemo(
    () =>
      KPIS.map((k) => ({
        def: k,
        ...k.derive(range, days),
      })),
    [range, days],
  )

  const areaLabels = useMemo(() => {
    const today = new Date(2026, 4, 9)
    return revenueSeries.map((_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (revenueSeries.length - 1 - i))
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    })
  }, [revenueSeries])

  const recapData: RecapInput = useMemo(() => {
    const totalRevenue = sum(revenueSeries)
    const half = Math.floor(revenueSeries.length / 2) || 1
    const recent = sum(revenueSeries.slice(half))
    const prior = sum(revenueSeries.slice(0, half)) || 1
    const revenueDelta = ((recent - prior) / prior) * 100

    const usersKpi = kpis.find((k) => k.def.id === "users")?.value ?? 0
    const conversionKpi = kpis.find((k) => k.def.id === "conversion")?.value ?? 0

    const bestIdx = dailyActivity.reduce(
      (best, v, i) => (v > dailyActivity[best] ? i : best),
      0,
    )

    return {
      rangeLabel: `Last ${days} days`,
      totalRevenue,
      revenueDelta,
      activeUsers: Math.round(usersKpi),
      conversion: conversionKpi,
      bestDay: { label: DOW[bestIdx], value: Math.round(dailyActivity[bestIdx]) },
      revenueSeries: revenueSeries.map((n) => Math.round(n)),
      channels: channels.map((c) => ({
        label: c.label,
        value: c.value,
        color: c.color,
      })),
      generatedAt: new Date().toISOString(),
    }
  }, [days, revenueSeries, dailyActivity, kpis, channels])

  return (
    <main
      id="app-main"
      className="relative isolate min-h-screen bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            color: "var(--foreground)",
          }}
        />
      </div>

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                App builder
              </Link>
              <span className="hidden text-muted-foreground/60 sm:inline">/</span>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
                  <ChartLineUp className="size-4" weight="bold" />
                </span>
                <div className="leading-tight">
                  <h1 className="font-heading text-sm font-semibold">
                    Insights dashboard
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    Live overview of product activity
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              className="shrink-0 sm:hidden"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <div
              className="flex flex-1 justify-center rounded-lg border border-border bg-background p-0.5 sm:flex-initial sm:justify-start"
              role="group"
              aria-label="Report date range"
            >
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRange(opt.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                    range === opt.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              className="hidden shrink-0 sm:inline-flex"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </Badge>
            <span className="text-xs text-muted-foreground">
              Updated just now
            </span>
          </div>
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">
            Welcome back. Here&apos;s how things are trending.
          </h2>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(({ def, value, delta }, i) => {
            const Icon = def.icon
            const positive = delta >= 0
            return (
              <Card
                key={def.id}
                className="group relative cursor-default transition-all duration-300 hover:-translate-y-0.5 hover:ring-foreground/20 animate-in fade-in slide-in-from-bottom-3"
                style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}
              >
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <CardDescription className="text-xs">
                      {def.label}
                    </CardDescription>
                    <CardTitle className="font-heading text-2xl tabular-nums">
                      <AnimatedCounter value={value} format={def.format} />
                    </CardTitle>
                  </div>
                  <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4" weight="duotone" />
                  </span>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
                        positive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {positive ? (
                        <ArrowUp className="size-3" weight="bold" />
                      ) : (
                        <ArrowDown className="size-3" weight="bold" />
                      )}
                      {Math.abs(delta).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs previous</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card
            className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "320ms", animationFillMode: "both" }}
          >
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div className="space-y-1">
                <CardDescription className="text-xs uppercase tracking-wide">
                  Revenue
                </CardDescription>
                <CardTitle className="font-heading text-xl tabular-nums">
                  $
                  <AnimatedCounter
                    value={sum(revenueSeries)}
                    format={(n) =>
                      Math.round(n).toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })
                    }
                  />
                </CardTitle>
              </div>
              <Badge variant="outline" className="gap-1">
                <ChartLineUp className="size-3" weight="bold" />
                Last {days} days
              </Badge>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={revenueSeries}
                labels={areaLabels}
                height={240}
                formatValue={(n) => `$${Math.round(n).toLocaleString()}`}
              />
            </CardContent>
          </Card>

          <Card
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "390ms", animationFillMode: "both" }}
          >
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-wide">
                Traffic by channel
              </CardDescription>
              <CardTitle className="font-heading text-base">
                Where users come from
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={channels}
                centerLabel="Sessions"
                centerValue={sum(channels.map((c) => c.value)).toLocaleString()}
              />
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card
            className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "460ms", animationFillMode: "both" }}
          >
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div className="space-y-1">
                <CardDescription className="text-xs uppercase tracking-wide">
                  Activity
                </CardDescription>
                <CardTitle className="font-heading text-base">
                  Sessions per weekday
                </CardTitle>
              </div>
              <Badge variant="secondary">Past week</Badge>
            </CardHeader>
            <CardContent>
              <BarChart data={dailyActivity} labels={DOW} height={200} />
            </CardContent>
          </Card>

          <Card
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "530ms", animationFillMode: "both" }}
          >
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-wide">
                Activity feed
              </CardDescription>
              <CardTitle className="font-heading text-base">
                What just happened
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-2.5">
                {ACTIVITY.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <li
                      key={item.title}
                      className="group flex items-start gap-2.5 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/40 animate-in fade-in slide-in-from-right-2"
                      style={{
                        animationDelay: `${600 + i * 80}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-md transition-transform group-hover:scale-110",
                          TONE_CLASS[item.tone],
                        )}
                      >
                        <Icon className="size-3.5" weight="bold" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-tight">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.meta}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6">
          <RecapCard
            data={recapData}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
          />
        </section>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Demo data is generated locally and resets on reload. Built with Next.js, Tailwind v4, tw-animate-css, and Remotion.
        </p>
      </div>
    </main>
  )
}
