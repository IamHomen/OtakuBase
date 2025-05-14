"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"

// Function to get a random default avatar
export async function getRandomDefaultAvatar(): Promise<string> {
  const avatarCount = 10
  const randomIndex = Math.floor(Math.random() * avatarCount) + 1
  return `/avatars/avatar${randomIndex}.jpg`
}

export async function uploadAvatar(formData: FormData) {
  const supabase = createServerSupabaseClient()

  try {
    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      return { error: "You must be logged in to upload an avatar" }
    }

    const userId = session.session.user.id
    const avatarFile = formData.get("avatar") as File

    // If no file was uploaded, use a random default avatar
    if (!avatarFile || avatarFile.size === 0) {
      const defaultAvatar = await getRandomDefaultAvatar()

      // Update the user's profile with the default avatar
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: defaultAvatar,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        return { error: "Failed to update profile with default avatar" }
      }

      return { success: true, avatarUrl: defaultAvatar }
    }

    // Check file type
    if (!avatarFile.type.startsWith("image/")) {
      return { error: "Only image files are allowed" }
    }

    // Check file size (max 2MB)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return { error: "File size must be less than 2MB" }
    }

    // Upload to Supabase Storage
    const fileExt = avatarFile.name.split(".").pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError, data } = await supabase.storage.from("avatars").upload(filePath, avatarFile, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      return { error: "Failed to upload avatar" }
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath)

    // Update the user's profile with the new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return { error: "Failed to update profile with new avatar" }
    }

    return { success: true, avatarUrl: publicUrl }
  } catch (error: any) {
    console.error("Error uploading avatar:", error)
    return { error: error.message || "Failed to upload avatar" }
  }
}

export async function registerWithAvatar(formData: FormData) {
  const supabase = createServerSupabaseClient()

  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const username = formData.get("username") as string
    const avatarFile = formData.get("avatar") as File

    // Register the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split("@")[0],
        },
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: "Failed to create user" }
    }

    const userId = authData.user.id

    // Determine avatar URL (uploaded or default)
    let avatarUrl = ""

    if (!avatarFile || avatarFile.size === 0) {
      // Use a random default avatar
      avatarUrl = await getRandomDefaultAvatar()
    } else {
      // Check file type
      if (!avatarFile.type.startsWith("image/")) {
        return { error: "Only image files are allowed" }
      }

      // Check file size (max 2MB)
      if (avatarFile.size > 2 * 1024 * 1024) {
        return { error: "File size must be less than 2MB" }
      }

      // Upload to Supabase Storage
      const fileExt = avatarFile.name.split(".").pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        // If upload fails, use a default avatar
        avatarUrl = await getRandomDefaultAvatar()
      } else {
        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath)

        avatarUrl = publicUrl
      }
    }

    // Create or update the user's profile with the avatar URL
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      username: username || email.split("@")[0],
      avatar_url: avatarUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      return { error: "Failed to create profile" }
    }

    return { success: true, message: "Registration successful! Please check your email to confirm your account." }
  } catch (error: any) {
    console.error("Error registering user:", error)
    return { error: error.message || "Failed to register" }
  }
}
