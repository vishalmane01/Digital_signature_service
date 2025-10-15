import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getSupabaseServer } from "@/lib/supabase/server"
import { sha256Buffer } from "@/lib/crypto"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const arrayBuf = Buffer.from(await file.arrayBuffer())
    const sha256 = await sha256Buffer(arrayBuf)

    const { url } = await put(`documents/${user.id}/${crypto.randomUUID()}-${file.name}`, arrayBuf, {
      access: "public", // switch to 'private' + signed URLs when you add auth-gated access
      token: process.env.BLOB_READ_WRITE_TOKEN, // provided via integration
      contentType: file.type || "application/octet-stream",
    })

    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        filename: file.name,
        size_bytes: file.size,
        blob_url: url,
        sha256,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ document: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 })
  }
}
