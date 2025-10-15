import { redirect } from "next/navigation"
import { getSupabaseServer } from "@/lib/supabase/server"
import UploadDocument from "@/components/upload-document"
import SignDocument from "@/components/sign-document"
import VerifyDocument from "@/components/verify-document"
import DocumentsList from "@/components/documents-list"

export default async function DashboardPage() {
  const supabase = getSupabaseServer()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) redirect("/(auth)/login")

  return (
    <main className="mx-auto max-w-5xl p-6 grid gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary text-balance">Digital Signature Service</h1>
        <form action="/api/auth/signout" method="post">
          <button className="rounded-md border px-3 py-2">Sign out</button>
        </form>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Upload document</h2>
          <UploadDocument />
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Your documents</h2>
          <DocumentsList />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Generate signature</h2>
          <SignDocument />
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Verify signature</h2>
          <VerifyDocument />
        </div>
      </section>
    </main>
  )
}
