import { NextResponse } from "next/server"

// This endpoint demonstrates the API surface. Provide a PEM certificate chain to validate.
// Production: implement proper X.509 chain building, trust store validation, OCSP/CRL checks, or call an external service.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const leafPem = searchParams.get("leafPem")
  if (!leafPem) {
    return NextResponse.json({ ok: false, reason: "leafPem required" }, { status: 400 })
  }

  // Placeholder: If CERT_VALIDATION_URL is set, forward request.
  const url = process.env.CERT_VALIDATION_URL
  if (url) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leafPem }),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: !!data?.ok, details: data })
  }

  return NextResponse.json(
    {
      ok: false,
      reason: "Certificate validation not configured. Provide CERT_VALIDATION_URL or integrate a validation service.",
    },
    { status: 501 },
  )
}
