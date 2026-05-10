import {
  AgentRunCancelledError,
  cancelAgentRun,
  getPublicSession,
  streamAgentResponse,
  type AgentStreamEvent,
} from "@/lib/app-builder/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Guardrail so oversized prompts cannot exhaust memory or upstream limits. */
const MAX_MESSAGE_LENGTH = 100_000

type ChatRequest = {
  sessionId?: string
  message?: string
  model?: string
}

type CancelRequest = {
  sessionId?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest

  if (!body.sessionId || !body.message?.trim()) {
    return Response.json(
      { error: "sessionId and message are required." },
      { status: 400 }
    )
  }

  if (body.message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      {
        error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`,
      },
      { status: 413 }
    )
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      let closed = false
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
          // Controller may already be closed if the client disconnected.
        }
      }

      try {
        const session = await getPublicSession(body.sessionId!)
        send("session", session)

        await streamAgentResponse(
          body.sessionId!,
          body.message!,
          body.model,
          (event: AgentStreamEvent) => send(event.type, event),
          request.signal
        )

        send("done", { ok: true })
      } catch (error) {
        if (error instanceof AgentRunCancelledError || isAbortError(error)) {
          send("cancelled", { ok: true })
        } else {
          const message = getFriendlyErrorMessage(error)
          send("error", { message })
        }
      } finally {
        closed = true
        try {
          controller.close()
        } catch {
          // Stream may already be closed.
        }
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

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CancelRequest
  const sessionId = body.sessionId?.trim()

  if (!sessionId) {
    return Response.json(
      { error: "sessionId is required." },
      { status: 400 }
    )
  }

  const cancelled = await cancelAgentRun(sessionId)
  return Response.json({ cancelled })
}

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "ResponseAborted")
  )
}

function getFriendlyErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "The agent run failed."

  if (message.toLowerCase().includes("already has active run")) {
    return "Cursor is still working on the previous request. Wait a moment and try again."
  }

  return message
}
