"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  CheckCircleIcon as CheckCircle,
  InfoIcon as Info,
  WarningCircleIcon as WarningCircle,
  XIcon as X,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

export type ToastVariant = "success" | "info" | "error"

export type ToastInput = {
  id?: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type Toast = Required<Pick<ToastInput, "title">> & {
  id: string
  description?: string
  variant: ToastVariant
  duration: number
}

type ToastContextValue = {
  showToast: (toast: ToastInput) => string
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION_MS = 4_000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? createToastId()
      const toast: Toast = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "success",
        duration: Math.max(1_000, input.duration ?? DEFAULT_DURATION_MS),
      }

      setToasts((current) => {
        const existing = current.findIndex((entry) => entry.id === id)
        if (existing !== -1) {
          return current.map((entry) => (entry.id === id ? toast : entry))
        }
        return [...current, toast]
      })

      const previousTimeout = timeoutsRef.current.get(id)
      if (previousTimeout) {
        clearTimeout(previousTimeout)
      }
      const timeout = setTimeout(() => {
        dismissToast(id)
      }, toast.duration)
      timeoutsRef.current.set(id, timeout)

      return id
    },
    [dismissToast]
  )

  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout)
      }
      timeouts.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = getToastIcon(toast.variant)
        return (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-md border bg-card p-3 text-sm text-card-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-200",
              getToastBorderClass(toast.variant)
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                getToastIconWrapperClass(toast.variant)
              )}
            >
              <Icon className="size-3.5" weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-5">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => onDismiss(toast.id)}
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function getToastIcon(variant: ToastVariant) {
  if (variant === "success") return CheckCircle
  if (variant === "error") return WarningCircle
  return Info
}

function getToastIconWrapperClass(variant: ToastVariant) {
  if (variant === "success") {
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
  }
  if (variant === "error") {
    return "bg-destructive/15 text-destructive"
  }
  return "bg-muted text-foreground"
}

function getToastBorderClass(variant: ToastVariant) {
  if (variant === "error") {
    return "border-destructive/30"
  }
  return "border-border"
}

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
