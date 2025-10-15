"use client"
import useSWR from "swr"

type Doc = {
  id: string
  filename: string
  size_bytes: number
  blob_url: string
  sha256: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DocumentsList() {
  const { data, isLoading, error, mutate } = useSWR<{ documents: Doc[] }>("/api/documents/list", fetcher)

  if (isLoading) return <p>Loading...</p>
  if (error) return <p className="text-destructive">Failed to load</p>

  return (
    <div className="grid gap-3">
      {data?.documents?.length ? (
        data.documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{d.filename}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round(d.size_bytes / 1024)} KB · {d.sha256.slice(0, 16)}...
              </p>
            </div>
            <a className="text-primary underline" href={d.blob_url} target="_blank" rel="noreferrer">
              View
            </a>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      )}
      <button onClick={() => mutate()} className="justify-self-start rounded-md border px-3 py-2 text-sm">
        Refresh
      </button>
    </div>
  )
}
