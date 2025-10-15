"use client"

import type React from "react"
import { useState } from "react"

type UploadItem = {
  file: File
  progress: number
  status: "idle" | "uploading" | "done" | "error"
  result?: { blobUrl: string; sha256: string; size: number }
  error?: string
}

export default function BulkUpload() {
  const [items, setItems] = useState<UploadItem[]>([])
  const [busy, setBusy] = useState(false)

  function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    const next = Array.from(files).map((f) => ({
      file: f,
      progress: 0,
      status: "idle" as const,
    }))
    setItems((prev) => [...prev, ...next])
  }

  async function uploadOne(index: number) {
    const item = items[index]
    if (!item) return

    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], status: "uploading", progress: 10 }
      return copy
    })

    try {
      const fd = new FormData()
      fd.append("file", item.file)

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: fd,
      })

      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()

      setItems((prev) => {
        const copy = [...prev]
        copy[index] = {
          ...copy[index],
          status: "done",
          progress: 100,
          result: json,
        } as UploadItem
        return copy
      })
    } catch (err: any) {
      setItems((prev) => {
        const copy = [...prev]
        copy[index] = { ...copy[index], status: "error", error: err?.message || "Upload failed" }
        return copy
      })
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setBusy(true)
    for (let i = 0; i < items.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(i)
    }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="p-4 rounded border-dashed border-2">
        <label className="text-sm block mb-2">Select multiple files</label>
        <input
          type="file"
          multiple
          onChange={(e) => onFilesSelected(e.target.files)}
          className="block w-full text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={busy || items.length === 0}
        className="self-start px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
      >
        {busy ? "Uploading..." : "Start Upload"}
      </button>

      <div className="flex flex-col gap-3">
        {items.map((it, idx) => (
          <div
            key={`${it.file.name}-${idx}`}
            className="p-3 border rounded flex flex-col gap-1 bg-card text-card-foreground"
          >
            <div className="text-sm font-medium">{it.file.name}</div>
            <div className="text-xs text-muted-foreground">{Math.round(it.file.size / 1024)} KB</div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div className={`h-2 bg-primary transition-all`} style={{ width: `${it.progress}%` }} />
            </div>
            {it.status === "done" && it.result && (
              <div className="text-xs mt-1">
                <div>sha256: {it.result.sha256}</div>
                <div className="truncate">
                  url:{" "}
                  <a className="underline" href={it.result.blobUrl} target="_blank" rel="noreferrer">
                    {it.result.blobUrl}
                  </a>
                </div>
              </div>
            )}
            {it.status === "error" && <div className="text-xs text-destructive">{it.error}</div>}
          </div>
        ))}
      </div>
    </form>
  )
}
