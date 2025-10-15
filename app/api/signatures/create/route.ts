import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { signRsaSha256Pem } from "@/lib/crypto"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { documentId, privateKeyPem } = await req.json()
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 })

  // Fetch document for hash
  const { data: doc, error: dErr } = await supabase.from("documents").select("id, sha256").eq("id", documentId).single()
  if (dErr || !doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

  // Use provided PEM for demo only, otherwise fallback to env DEMO_PRIVATE_KEY_PEM if present
  const pem = (privateKeyPem && String(privateKeyPem)) || process.env.DEMO_PRIVATE_KEY_PEM
  if (!pem)
    return NextResponse.json(
      { error: "No private key provided. Provide PEM in request or set DEMO_PRIVATE_KEY_PEM." },
      { status: 400 },
    )

  const signature = signRsaSha256Pem(pem, Buffer.from(doc.sha256, "hex"))

  const { data: sig, error } = await supabase
    .from("signatures")
    .insert({
      document_id: doc.id,
      user_id: user.id,
      algorithm: "RSA-SHA256",
      signature_base64: signature,
      public_key_pem: null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ signature, signatureId: sig.id })
}
