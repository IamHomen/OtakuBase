import { redirect } from "next/navigation"
import { getSession, getUserProfile } from "@/lib/supabase-server"
import { ProfileForm } from "@/app/profile/profile-form"

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const profile = await getUserProfile()

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <ProfileForm user={session.user} profile={profile} />
      </div>
    </div>
  )
}
