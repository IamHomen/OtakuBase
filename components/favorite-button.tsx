"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useFirebase } from "@/lib/firebase-provider"
import { addToFavorites, removeFromFavorites, isFavorite } from "@/lib/firebase-db"
import { getAnimeTitle } from "@/lib/utils"

interface FavoriteButtonProps {
  anime: any
}

export function FavoriteButton({ anime }: FavoriteButtonProps) {
  const [isAnimeFavorite, setIsAnimeFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useFirebase()
  const { toast } = useToast()

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const { isFavorite: favoriteStatus } = await isFavorite(user.uid, anime.id)
        setIsAnimeFavorite(favoriteStatus)
      } catch (error) {
        console.error("Error checking favorite status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkFavoriteStatus()
  }, [anime.id, user])

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add favorites",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isAnimeFavorite) {
        // Remove from favorites
        const { error } = await removeFromFavorites(user.uid, anime.id)

        if (error) {
          throw new Error(error)
        }

        setIsAnimeFavorite(false)
        toast({
          title: "Removed from favorites",
          description: `${getAnimeTitle(anime)} has been removed from your favorites`,
        })
      } else {
        // Add to favorites
        const { error } = await addToFavorites(
          user.uid,
          anime.id,
          getAnimeTitle(anime),
          anime.coverImage.extraLarge || anime.coverImage.large,
        )

        if (error) {
          throw new Error(error)
        }

        setIsAnimeFavorite(true)
        toast({
          title: "Added to favorites",
          description: `${getAnimeTitle(anime)} has been added to your favorites`,
        })
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update favorites",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isAnimeFavorite ? "default" : "outline"}
      size="sm"
      onClick={toggleFavorite}
      disabled={isLoading}
      className="gap-1"
    >
      <Heart className={`h-4 w-4 ${isAnimeFavorite ? "fill-current" : ""}`} />
      {isAnimeFavorite ? "Favorited" : "Add to Favorites"}
    </Button>
  )
}
