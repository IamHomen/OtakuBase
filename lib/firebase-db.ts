import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase-config"

// Favorites
export async function addToFavorites(userId: string, animeId: number, animeTitle: string, animeCoverImage: string) {
  try {
    await addDoc(collection(db, "favorites"), {
      userId,
      animeId,
      animeTitle,
      animeCoverImage,
      addedAt: serverTimestamp(),
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function removeFromFavorites(userId: string, animeId: number) {
  try {
    const q = query(collection(db, "favorites"), where("userId", "==", userId), where("animeId", "==", animeId))
    const querySnapshot = await getDocs(q)

    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref)
    })

    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getFavorites(userId: string) {
  try {
    const q = query(collection(db, "favorites"), where("userId", "==", userId), orderBy("addedAt", "desc"))
    const querySnapshot = await getDocs(q)

    const favorites = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: doc.data().addedAt?.toDate(),
    }))

    return { data: favorites, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

export async function isFavorite(userId: string, animeId: number) {
  try {
    const q = query(collection(db, "favorites"), where("userId", "==", userId), where("animeId", "==", animeId))
    const querySnapshot = await getDocs(q)

    return { isFavorite: !querySnapshot.empty, error: null }
  } catch (error: any) {
    return { isFavorite: false, error: error.message }
  }
}

// Watch Status
export async function updateWatchStatus(userId: string, animeId: number, status: string, progress = 0) {
  try {
    const q = query(collection(db, "watchStatus"), where("userId", "==", userId), where("animeId", "==", animeId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Create new watch status
      await addDoc(collection(db, "watchStatus"), {
        userId,
        animeId,
        status,
        progress,
        updatedAt: serverTimestamp(),
      })
    } else {
      // Update existing watch status
      const docRef = querySnapshot.docs[0].ref
      await updateDoc(docRef, {
        status,
        progress,
        updatedAt: serverTimestamp(),
      })
    }

    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getWatchStatus(userId: string, animeId: number) {
  try {
    const q = query(collection(db, "watchStatus"), where("userId", "==", userId), where("animeId", "==", animeId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data()
      return {
        data: {
          ...data,
          updatedAt: data.updatedAt?.toDate(),
        },
        error: null,
      }
    }

    return { data: null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Comments - Fixed to properly handle Firestore timestamps
export async function addComment(userId: string, animeId: number, content: string, parentId?: string) {
  try {
    const commentData = {
      userId,
      animeId,
      content,
      parentId: parentId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    console.log("Adding comment with data:", commentData)

    const docRef = await addDoc(collection(db, "comments"), commentData)
    console.log("Comment added with ID:", docRef.id)

    return { error: null }
  } catch (error: any) {
    console.error("Error adding comment:", error)
    return { error: error.message }
  }
}

export async function getComments(animeId: number) {
  try {
    console.log("Fetching comments for animeId:", animeId)

    const q = query(collection(db, "comments"), where("animeId", "==", animeId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    console.log("Found", querySnapshot.docs.length, "comments")

    const comments = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log("Comment data:", data)

      return {
        id: doc.id,
        ...data,
        // Handle Firestore Timestamp conversion
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      }
    })

    console.log("Processed comments:", comments)
    return { data: comments, error: null }
  } catch (error: any) {
    console.error("Error fetching comments:", error)
    return { data: [], error: error.message }
  }
}

export async function deleteComment(commentId: string, userId: string) {
  try {
    const docRef = doc(db, "comments", commentId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists() && docSnap.data().userId === userId) {
      await deleteDoc(docRef)

      // Delete replies to this comment
      const repliesQuery = query(collection(db, "comments"), where("parentId", "==", commentId))
      const repliesSnapshot = await getDocs(repliesQuery)

      repliesSnapshot.forEach(async (replyDoc) => {
        await deleteDoc(replyDoc.ref)
      })

      return { error: null }
    } else {
      return { error: "Comment not found or unauthorized" }
    }
  } catch (error: any) {
    return { error: error.message }
  }
}
