"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFirebase } from "@/lib/firebase-provider"
import { getFavorites, removeFromFavorites } from "@/lib/firebase-db"
import { useToast } from "@/components/ui/use-toast"

interface Favorite {
  id: string
  animeId: number
  animeTitle: string
  animeCoverImage: string
  addedAt: Date
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useFirebase()
  const { toast } = useToast()

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await getFavorites(user.uid)

        if (error) {
          throw new Error(error)
        }

        setFavorites(data as Favorite[])
      } catch (error: any) {
        console.error("Error fetching favorites:", error)
        toast({
          title: "Error",
          description: "Failed to load favorites",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [user, toast])

  const handleRemoveFavorite = async (animeId: number, animeTitle: string) => {
    if (!user) return

    try {
      const { error } = await removeFromFavorites(user.uid, animeId)

      if (error) {
        throw new Error(error)
      }

      setFavorites((prev) => prev.filter((fav) => fav.animeId !== animeId))
      toast({
        title: "Removed from favorites",
        description: `${animeTitle} has been removed from your favorites`,
      })
    } catch (error: any) {
      console.error("Error removing favorite:", error)
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">My Favorites</h1>
          <p className="text-muted-foreground mb-6">Please log in to view your favorite anime</p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading favorites...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-red-500" />
        <h1 className="text-3xl font-bold">My Favorites</h1>
        <span className="text-muted-foreground">({favorites.length})</span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground mb-6">Start adding anime to your favorites to see them here</p>
          <Button asChild>
            <Link href="/">Browse Anime</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favorites.map((favorite) => (
            <Card key={favorite.id} className="overflow-hidden group">
              <div className="relative aspect-[3/4]">
                <Link href={`/anime/${favorite.animeId}`}>
                  <Image
                    src={favorite.animeCoverImage || "/placeholder.svg"}
                    alt={favorite.animeTitle}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveFavorite(favorite.animeId, favorite.animeTitle)}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>
              <CardContent className="p-3">
                <Link href={`/anime/${favorite.animeId}`}>
                  <h3 className="font-medium line-clamp-2 text-sm hover:text-primary transition-colors">
                    {favorite.animeTitle}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-1">Added {favorite.addedAt.toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
