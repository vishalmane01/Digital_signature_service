import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { sha256 } from "@/lib/crypto"

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "file missing" }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const hashHex = await sha256(arrayBuffer)
    const pathname = `documents/${Date.now()}-${hashHex}-${file.name}`

    // Demo: public access for ease of verification; switch to "private" in production.
    const { url } = await put(pathname, arrayBuffer, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    })

    return NextResponse.json({ url, pathname, hashHex, size: file.size })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "upload failed" }, { status: 500 })
  }
}
