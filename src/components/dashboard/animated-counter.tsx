"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

type AnimatedCounterProps = {
  value: number
  duration?: number
  format?: (n: number) => string
}

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

export function AnimatedCounter({
  value,
  duration = 900,
  format,
}: AnimatedCounterProps) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
  const [animated, setAnimated] = useState(value)
  const fromRef = useRef(value)
  const wasReducedMotionRef = useRef(prefersReducedMotion)
  const shown = prefersReducedMotion ? value : animated

  useLayoutEffect(() => {
    if (wasReducedMotionRef.current && !prefersReducedMotion) {
      setAnimated(fromRef.current)
    }
    wasReducedMotionRef.current = prefersReducedMotion
  }, [prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) {
      fromRef.current = value
      return
    }
    const from = fromRef.current
    if (from === value) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (value - from) * eased
      setAnimated(next)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, prefersReducedMotion])

  return <>{format ? format(shown) : Math.round(shown).toLocaleString()}</>
}
