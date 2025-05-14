"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function addComment(animeId: number, content: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session) {
      return { error: "You must be logged in to comment" }
    }

    const { error } = await supabase.from("comments").insert({
      user_id: session.session.user.id,
      anime_id: animeId,
      content: content.trim(),
      parent_id: null,
    })

    if (error) {
      console.error("Error adding comment:", error)
      return { error: error.message }
    }

    // Revalidate the anime page to show the new comment
    revalidatePath(`/anime/${animeId}`)

    return { success: true }
  } catch (error: any) {
    console.error("Error adding comment:", error)
    return { error: error.message || "Failed to add comment" }
  }
}

export async function addReply(animeId: number, content: string, parentId: number) {
  const supabase = createServerSupabaseClient()

  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session) {
      return { error: "You must be logged in to reply" }
    }

    // Verify parent comment exists
    const { data: parentComment } = await supabase.from("comments").select("id").eq("id", parentId).single()

    if (!parentComment) {
      return { error: "Parent comment not found" }
    }

    const { error } = await supabase.from("comments").insert({
      user_id: session.session.user.id,
      anime_id: animeId,
      content: content.trim(),
      parent_id: parentId,
    })

    if (error) {
      console.error("Error adding reply:", error)
      return { error: error.message }
    }

    // Revalidate the anime page to show the new reply
    revalidatePath(`/anime/${animeId}`)

    return { success: true }
  } catch (error: any) {
    console.error("Error adding reply:", error)
    return { error: error.message || "Failed to add reply" }
  }
}

export async function deleteComment(commentId: number, animeId: number) {
  const supabase = createServerSupabaseClient()

  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session.session) {
      return { error: "You must be logged in to delete a comment" }
    }

    // First, delete any replies to this comment
    const { error: repliesError } = await supabase.from("comments").delete().eq("parent_id", commentId)

    if (repliesError) {
      console.error("Error deleting replies:", repliesError)
      return { error: repliesError.message }
    }

    // Then delete the comment itself
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", session.session.user.id)

    if (error) {
      console.error("Error deleting comment:", error)
      return { error: error.message }
    }

    // Revalidate the anime page to reflect the deleted comment
    revalidatePath(`/anime/${animeId}`)

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    return { error: error.message || "Failed to delete comment" }
  }
}
