import { type NextRequest, NextResponse } from "next/server"

// Simple, stateless manifest builder for a digital signature.
// Accepts query params, returns a portable JSON manifest you can encode as a QR,
// share, or archive alongside a document.
//
// Example:
//   /api/signatures/manifest?docUrl=https://...&sha256=...&sig=BASE64&alg=RSA-SHA256&keyId=demo&signedAt=2025-10-15T10:00:00Z
//
// Security note: This endpoint does not persist data or require env vars.
// Provide minimal fields to ensure verifiers can reconstruct the validation.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const docUrl = searchParams.get("docUrl") || undefined
  const sha256 = searchParams.get("sha256") || undefined
  const sig = searchParams.get("sig") || undefined
  const alg = searchParams.get("alg") || "RSA-SHA256"
  const keyId = searchParams.get("keyId") || undefined
  const signedAt = searchParams.get("signedAt") || new Date().toISOString()

  if (!sig || (!docUrl && !sha256)) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        required: ["sig", "docUrl or sha256"],
        example: "/api/signatures/manifest?docUrl=https://...&sha256=...&sig=BASE64&alg=RSA-SHA256&keyId=demo",
      },
      { status: 400 },
    )
  }

  const manifest = {
    schema: "urn:manifest:signature:v1",
    document: {
      url: docUrl,
      sha256,
    },
    signature: {
      algorithm: alg,
      valueBase64: sig,
      keyId,
      signedAt,
    },
    verification: {
      // Human-friendly path to offline verification tool in this app
      instructions: "Open /tools/verify and provide document + public key + signature.",
      toolUrl: "/tools/verify",
    },
  }

  return NextResponse.json(manifest, {
    headers: { "Cache-Control": "no-store" },
  })
}
