"use client"
import QRCode from "react-qr-code"

type QRManifestProps = {
  url: string
  title?: string
}

export function QRManifest({ url, title = "Scan to load manifest" }: QRManifestProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 border rounded-md bg-card text-card-foreground">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="bg-background p-3 rounded">
        <QRCode value={url} size={160} />
      </div>
      <div className="text-xs break-all text-muted-foreground text-center max-w-[260px]">{url}</div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground"
          onClick={() => {
            navigator.clipboard.writeText(url)
          }}
        >
          Copy URL
        </button>
        <a
          className="px-3 py-1 text-sm rounded bg-accent text-accent-foreground"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Open
        </a>
      </div>
    </div>
  )
}
