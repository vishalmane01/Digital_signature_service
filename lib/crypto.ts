import { createHash, createSign, createVerify } from "crypto"

export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hash = createHash("sha256")
  hash.update(Buffer.from(buffer))
  return hash.digest("hex")
}

export async function sha256Buffer(buffer: Buffer): Promise<string> {
  const hash = createHash("sha256")
  hash.update(buffer)
  return hash.digest("hex")
}

export function base64(bytes: ArrayBuffer | Buffer): string {
  return Buffer.from(bytes as Buffer).toString("base64")
}

export type KeyManager = {
  algorithm: "RSA-SHA256" | "ECDSA-SHA256"
  sign: (digestHex: string) => Promise<Buffer>
  getPublicKeyPem?: () => Promise<string | undefined>
  // Optionally fetch cert chain if using a managed identity/cert-based scheme
  getCertificateChainPem?: () => Promise<string[] | undefined>
}

// DEMO ONLY: Enable signing via server env PEMs (unsafe for production).
// Set DEMO_PRIVATE_KEY_PEM and optionally DEMO_PUBLIC_KEY_PEM.
// Production: configure KMS per provider envs as described below.
export function getKeyManager(): KeyManager {
  const demoPriv = process.env.DEMO_PRIVATE_KEY_PEM
  const demoPub = process.env.DEMO_PUBLIC_KEY_PEM

  // TODO: detect KMS provider by env and return appropriate KeyManager:
  // - AWS: AWS_KMS_KEY_ID, AWS_REGION
  // - GCP: GOOGLE_KMS_KEY_NAME, GOOGLE_APPLICATION_CREDENTIALS_JSON
  // - Azure: AZURE_KEY_VAULT_URL, AZURE_KEY_NAME, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET

  if (demoPriv) {
    const algorithm: KeyManager["algorithm"] =
      demoPriv.includes("BEGIN EC PRIVATE KEY") || demoPriv.includes("BEGIN PRIVATE KEY")
        ? "ECDSA-SHA256"
        : "RSA-SHA256"

    return {
      algorithm,
      async sign(digestHex: string) {
        const signer = createSign("sha256")
        signer.update(Buffer.from(digestHex, "hex"))
        signer.end()
        const signature = signer.sign(demoPriv, algorithm.startsWith("RSA") ? undefined : { dsaEncoding: "ieee-p1363" })
        return signature
      },
      async getPublicKeyPem() {
        return demoPub
      },
    }
  }

  // Not configured
  return {
    algorithm: "RSA-SHA256",
    async sign() {
      const e = new Error("Key manager not configured. Set DEMO_PRIVATE_KEY_PEM for demo or configure a KMS.")
      ;(e as any).code = "KMS_NOT_CONFIGURED"
      throw e
    },
  }
}

export function signRsaSha256Pem(privateKeyPem: string, digest: Buffer): string {
  const signer = createSign("sha256")
  signer.update(digest)
  signer.end()
  const signature = signer.sign(privateKeyPem)
  return signature.toString("base64")
}

export async function verifySignatureSHA256(
  digestHex: string,
  signature: Buffer,
  publicKeyPem: string,
  algorithmHint: "RSA-SHA256" | "ECDSA-SHA256" = "RSA-SHA256",
): Promise<boolean> {
  const verifier = createVerify("sha256")
  verifier.update(Buffer.from(digestHex, "hex"))
  verifier.end()
  return verifier.verify(
    publicKeyPem,
    signature,
    algorithmHint.startsWith("RSA") ? undefined : { dsaEncoding: "ieee-p1363" },
  )
}

// RFC 3161 TSA stub. Provide TSA_URL and optionally TSA_USERNAME, TSA_PASSWORD.
// Sends a simple JSON request with doc hash (NOT a real ASN.1 request).
// Replace with proper RFC 3161 implementation or a TSA SDK when available.
export async function requestTimestampToken(documentHashHex: string): Promise<string | undefined> {
  const url = process.env.TSA_URL
  if (!url) return undefined
  const payload = { hash: documentHashHex, algo: "SHA-256" }
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (process.env.TSA_USERNAME && process.env.TSA_PASSWORD) {
    const auth = Buffer.from(`${process.env.TSA_USERNAME}:${process.env.TSA_PASSWORD}`).toString("base64")
    headers["authorization"] = `Basic ${auth}`
  }
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(`TSA request failed with ${res.status}`)
  // Expect base64 token in JSON { tokenBase64: string }
  const data = await res.json().catch(() => ({}) as any)
  return data.tokenBase64
}
