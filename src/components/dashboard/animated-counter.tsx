"use client"

import { useEffect, useRef, useState } from "react"

type AnimatedCounterProps = {
  value: number
  duration?: number
  format?: (n: number) => string
}

export function AnimatedCounter({
  value,
  duration = 900,
  format,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (value - from) * eased
      setDisplay(next)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>
}
