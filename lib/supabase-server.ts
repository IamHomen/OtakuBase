import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

export async function getSession() {
  const supabase = createServerSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

export async function getUserProfile() {
  const supabase = createServerSupabaseClient()
  try {
    const { data: userSession } = await supabase.auth.getSession()

    if (!userSession.session) {
      return null
    }

    const { data } = await supabase.from("profiles").select("*").eq("id", userSession.session.user.id).single()

    return data
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}
