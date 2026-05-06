import {
  subscribeSessionLogs,
  UnknownAppBuilderSessionError,
  type SessionLogEntry,
} from "@/lib/app-builder/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const sessionId = id?.trim()

  if (!sessionId) {
    return Response.json(
      { error: "sessionId is required." },
      { status: 400 }
    )
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      let closed = false
      let unsubscribe: (() => void) | null = null
      let heartbeat: ReturnType<typeof setInterval> | null = null

      const send = (event: string, data: unknown) => {
        if (closed) {
          return
        }
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            )
          )
        } catch {
          // Stream may already be closed; cleanup runs in close().
        }
      }

      const close = () => {
        if (closed) {
          return
        }
        closed = true
        if (heartbeat) {
          clearInterval(heartbeat)
        }
        unsubscribe?.()
        try {
          controller.close()
        } catch {
          // Already closed.
        }
      }

      try {
        const subscription = subscribeSessionLogs(
          sessionId,
          (entry: SessionLogEntry) => {
            send("log", entry)
          }
        )
        unsubscribe = subscription.unsubscribe

        send("snapshot", { entries: subscription.initial })

        heartbeat = setInterval(() => {
          if (closed) {
            return
          }
          try {
            controller.enqueue(encoder.encode(": ping\n\n"))
          } catch {
            close()
          }
        }, 15_000)

        if (request.signal.aborted) {
          close()
        } else {
          request.signal.addEventListener("abort", close, { once: true })
        }
      } catch (error) {
        const message =
          error instanceof UnknownAppBuilderSessionError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Failed to read session logs."
        send("error", { message })
        close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  })
}
