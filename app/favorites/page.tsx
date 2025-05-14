import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSession, createServerSupabaseClient } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default async function FavoritesPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()
  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", session.user.id)
    .order("added_at", { ascending: false })

  if (error) {
    console.error("Error fetching favorites:", error)
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">My Favorites</h1>

      {favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {favorites.map((favorite) => (
            <Link key={favorite.id} href={`/anime/${favorite.anime_id}`}>
              <Card className="overflow-hidden h-full transition-all hover:scale-[1.02] hover:shadow-md">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <Image
                    src={favorite.anime_cover_image || "/placeholder.svg"}
                    alt={favorite.anime_title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 h-12">{favorite.anime_title}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You haven't added any favorites yet.</p>
          <Button asChild>
            <Link href="/">Browse Anime</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
