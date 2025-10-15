import BulkUpload from "@/components/bulk-upload"

export default function BulkUploadPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-primary text-balance">Bulk Document Upload</h1>
        <p className="text-sm text-muted-foreground">
          Upload multiple files to Blob. Each file will be stored and hashed on the server.
        </p>
      </header>
      <BulkUpload />
    </main>
  )
}
