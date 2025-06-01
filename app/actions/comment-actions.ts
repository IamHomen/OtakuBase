"use server"

import { addComment, deleteComment } from "@/lib/firebase-db"
import { revalidatePath } from "next/cache"

export async function addCommentAction(
  mediaId: number,
  content: string,
  userId: string,
  mediaType: "anime" | "manga" = "anime",
) {
  try {
    const { error } = await addComment(userId, mediaId, content)

    if (error) {
      return { error }
    }

    // Revalidate the appropriate page to show the new comment
    if (mediaType === "manga") {
      revalidatePath(`/manga/${mediaId}`)
    } else {
      revalidatePath(`/anime/${mediaId}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error adding comment:", error)
    return { error: error.message || "Failed to add comment" }
  }
}

export async function addReplyAction(
  mediaId: number,
  content: string,
  parentId: string,
  userId: string,
  mediaType: "anime" | "manga" = "anime",
) {
  try {
    const { error } = await addComment(userId, mediaId, content, parentId)

    if (error) {
      return { error }
    }

    // Revalidate the appropriate page to show the new reply
    if (mediaType === "manga") {
      revalidatePath(`/manga/${mediaId}`)
    } else {
      revalidatePath(`/anime/${mediaId}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error adding reply:", error)
    return { error: error.message || "Failed to add reply" }
  }
}

export async function deleteCommentAction(
  commentId: string,
  mediaId: number,
  userId: string,
  mediaType: "anime" | "manga" = "anime",
) {
  try {
    const { error } = await deleteComment(commentId, userId)

    if (error) {
      return { error }
    }

    // Revalidate the appropriate page to reflect the deleted comment
    if (mediaType === "manga") {
      revalidatePath(`/manga/${mediaId}`)
    } else {
      revalidatePath(`/anime/${mediaId}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    return { error: error.message || "Failed to delete comment" }
  }
}
