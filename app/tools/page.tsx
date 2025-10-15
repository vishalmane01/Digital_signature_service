// Simple hub that links to extra tools without editing your dashboard
import Link from "next/link"

export default function ToolsIndexPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-primary text-balance">Tools</h1>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <Link className="underline" href="/tools/verify">
            Offline Signature Verification
          </Link>
        </li>
        <li>
          <Link className="underline" href="/tools/upload-bulk">
            Bulk Document Upload
          </Link>
        </li>
        <li>
          <a
            className="underline"
            href="/api/signatures/manifest?docUrl=https://example.com/file.pdf&sha256=YOUR_SHA256&sig=BASE64_SIGNATURE&alg=RSA-SHA256&keyId=demo"
          >
            Example: Manifest JSON (QR-friendly)
          </a>
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">
        Tip: Use the manifest URL with the QR component to distribute verification details.
      </p>
    </main>
  )
}
