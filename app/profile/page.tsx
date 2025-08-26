import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProfileForm from "@/components/profile/profile-form"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile data
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch work experience
  const { data: workExperience } = await supabase
    .from("work_experience")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch coding platforms
  const { data: codingPlatforms } = await supabase.from("coding_platforms").select("*").eq("user_id", user.id)

  // Fetch skills
  const { data: skills } = await supabase
    .from("skills")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Student Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your academic and professional information</p>
        </div>

        <ProfileForm
          user={user}
          profile={profile}
          workExperience={workExperience || []}
          codingPlatforms={codingPlatforms || []}
          skills={skills || []}
        />
      </div>
    </div>
  )
}
