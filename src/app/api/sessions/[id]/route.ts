import { deleteSession } from "@/lib/app-builder/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const sessionId = id?.trim()

  if (!sessionId) {
    return Response.json(
      { error: "sessionId is required." },
      { status: 400 }
    )
  }

  const removed = await deleteSession(sessionId)
  return Response.json({ removed })
}
