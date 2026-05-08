import { mkdir, readFile, unlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { bundle } from "@remotion/bundler"
import { renderMedia, selectComposition } from "@remotion/renderer"
import { type NextRequest, NextResponse } from "next/server"

import { recapInputSchema } from "@/remotion/recap-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

let bundlePromise: Promise<string> | null = null

function getBundle() {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "index.ts"),
      onProgress: () => {},
    }).catch((err) => {
      bundlePromise = null
      throw err
    })
  }
  return bundlePromise
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new NextResponse("Invalid JSON body", { status: 400 })
  }

  const parsed = recapInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid recap input", issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const inputProps = parsed.data
  let outputPath: string | null = null

  try {
    const serveUrl = await getBundle()
    const composition = await selectComposition({
      serveUrl,
      id: "WeeklyRecap",
      inputProps,
    })

    const outDir = path.join(tmpdir(), "app-builder-recap")
    await mkdir(outDir, { recursive: true })
    outputPath = path.join(outDir, `recap-${Date.now()}.mp4`)

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      overwrite: true,
    })

    const buf = await readFile(outputPath)

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "content-type": "video/mp4",
        "content-length": String(buf.byteLength),
        "cache-control": "no-store",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new NextResponse(`Render failed: ${message}`, { status: 500 })
  } finally {
    if (outputPath) {
      unlink(outputPath).catch(() => {
        // ignore cleanup failure
      })
    }
  }
}
