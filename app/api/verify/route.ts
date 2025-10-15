import { NextResponse } from "next/server"
import { sha256, verifySignatureSHA256, getKeyManager } from "@/lib/crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const documentUrl: string | undefined = body?.documentUrl
    const signatureBase64: string | undefined = body?.signatureBase64
    const publicKeyPem: string | undefined = body?.publicKeyPem

    if (!documentUrl || !signatureBase64) {
      return NextResponse.json({ ok: false, reason: "documentUrl and signatureBase64 required" }, { status: 400 })
    }

    const res = await fetch(documentUrl, { cache: "no-store" })
    if (!res.ok)
      return NextResponse.json({ ok: false, reason: `failed to fetch document (${res.status})` }, { status: 400 })
    const buf = await res.arrayBuffer()
    const docHash = await sha256(buf)
    const signature = Buffer.from(signatureBase64, "base64")

    let pemToUse = publicKeyPem
    if (!pemToUse) {
      // Attempt to obtain public key from KeyManager (e.g., KMS GetPublicKey)
      const km = getKeyManager()
      pemToUse = (await km.getPublicKeyPem?.()) || undefined
    }

    if (!pemToUse) {
      return NextResponse.json({ ok: false, reason: "public key not provided and KMS not configured" }, { status: 501 })
    }

    const ok = await verifySignatureSHA256(
      docHash,
      signature,
      pemToUse,
      pemToUse.includes("EC") ? "ECDSA-SHA256" : "RSA-SHA256",
    )
    return NextResponse.json({
      ok,
      documentHashHex: docHash,
      signatureAlgorithm: pemToUse.includes("EC") ? "ECDSA-SHA256" : "RSA-SHA256",
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: e?.message ?? "verify failed" }, { status: 500 })
  }
}
