// src/lib/supabase-server.ts
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function createSupabaseServerClient() {
  // Next 16: cookies() peut être async selon le runtime
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {
          // No-op in Server Components
        },
        remove() {
          // No-op in Server Components
        },
      },
    }
  )
}