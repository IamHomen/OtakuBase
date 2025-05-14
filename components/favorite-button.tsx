"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { getAnimeTitle } from "@/lib/utils"

interface FavoriteButtonProps {
  anime: any
}

export function FavoriteButton({ anime }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  const { supabase: supabaseClient } = useSupabase()
  const supabase = supabaseClient

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data } = await supabase
            .from("favorites")
            .select("*")
            .eq("user_id", user.id)
            .eq("anime_id", anime.id)
            .single()

          setIsFavorite(!!data)
        }
      } catch (error) {
        console.error("Error fetching user or favorites:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [anime.id, supabase])

  const toggleFavorite = async () => {
    if (!supabase) {
      toast({
        title: "Service unavailable",
        description: "The favorites service is currently unavailable",
        variant: "destructive",
      })
      return
    }

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
      if (isFavorite) {
        // Remove from favorites
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("anime_id", anime.id)

        setIsFavorite(false)
        toast({
          title: "Removed from favorites",
          description: `${getAnimeTitle(anime)} has been removed from your favorites`,
        })
      } else {
        // Add to favorites
        await supabase.from("favorites").insert({
          user_id: user.id,
          anime_id: anime.id,
          anime_title: getAnimeTitle(anime),
          anime_cover_image: anime.coverImage.extraLarge || anime.coverImage.large,
        })

        setIsFavorite(true)
        toast({
          title: "Added to favorites",
          description: `${getAnimeTitle(anime)} has been added to your favorites`,
        })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFavorite ? "default" : "outline"}
      size="sm"
      onClick={toggleFavorite}
      disabled={isLoading || !supabase}
      className="gap-1"
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
      {isFavorite ? "Favorited" : "Add to Favorites"}
    </Button>
  )
}
