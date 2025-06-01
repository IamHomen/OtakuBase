"use server"

// Function to get a random default avatar
export async function getRandomDefaultAvatar(): Promise<string> {
  const avatarCount = 10
  const randomIndex = Math.floor(Math.random() * avatarCount) + 1
  return `/avatars/avatar${randomIndex}.jpg`
}

// Simple server action that just returns a default avatar
// The actual upload will be handled client-side
export async function uploadAvatar(formData: FormData) {
  try {
    const avatarFile = formData.get("avatar") as File

    // If no file was uploaded, use a random default avatar
    if (!avatarFile || avatarFile.size === 0) {
      const defaultAvatar = await getRandomDefaultAvatar()
      return { success: true, avatarUrl: defaultAvatar }
    }

    // Check file type
    if (!avatarFile.type.startsWith("image/")) {
      return { error: "Only image files are allowed" }
    }

    // Check file size (max 2MB)
    if (avatarFile.size > 2 * 1024 * 1024) {
      return { error: "File size must be less than 2MB" }
    }

    // For now, return a default avatar since client-side upload will handle the actual file
    const defaultAvatar = await getRandomDefaultAvatar()
    return { success: true, avatarUrl: defaultAvatar, needsClientUpload: true }
  } catch (error: any) {
    console.error("Error processing avatar:", error)
    const defaultAvatar = await getRandomDefaultAvatar()
    return { success: true, avatarUrl: defaultAvatar }
  }
}
