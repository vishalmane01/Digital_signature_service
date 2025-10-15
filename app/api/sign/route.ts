import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { base64, getKeyManager, requestTimestampToken, sha256 } from "@/lib/crypto"
import { appendAuditLog } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const documentUrl: string | undefined = body?.documentUrl
    const certificateChainPem: string[] | undefined = body?.certificateChainPem

    if (!documentUrl) return NextResponse.json({ error: "documentUrl required" }, { status: 400 })

    const res = await fetch(documentUrl, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ error: `failed to fetch document (${res.status})` }, { status: 400 })
    const buf = await res.arrayBuffer()
    const docHash = await sha256(buf)

    const km = getKeyManager()
    let signature: Buffer
    try {
      signature = await km.sign(docHash)
    } catch (err: any) {
      if (err?.code === "KMS_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error:
              "Key manager not configured. Set DEMO_PRIVATE_KEY_PEM (demo) or configure a KMS via environment variables.",
            documentHashHex: docHash,
          },
          { status: 501 },
        )
      }
      throw err
    }

    const timestampTokenBase64 = await requestTimestampToken(docHash).catch(() => undefined)
    const publicKeyPem = (await km.getPublicKeyPem?.()) || undefined

    const record = {
      documentUrl,
      documentHashHex: docHash,
      algorithm: km.algorithm,
      signatureBase64: base64(signature),
      publicKeyPem,
      certificateChainPem,
      timestampTokenBase64,
      createdAt: new Date().toISOString(),
    }

    const signaturePath = `signatures/${Date.now()}-${docHash}.json`
    const { url: signatureRecordUrl } = await put(signaturePath, JSON.stringify(record, null, 2), {
      access: "public",
      contentType: "application/json",
    })

    await appendAuditLog({ eventType: "sign", documentUrl, signatureRecordUrl })

    return NextResponse.json({ ...record, signatureRecordUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "sign failed" }, { status: 500 })
  }
}
