import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getAnimeTitle } from "@/lib/utils"
import type { AnimePreview } from "@/lib/anilist-api"

interface AnimeCardProps {
  anime: AnimePreview
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const title = getAnimeTitle(anime)

  return (
    <Link href={`/anime/${anime.id}`}>
      <Card className="overflow-hidden h-full transition-all hover:scale-[1.02] hover:shadow-md">
        <div className="aspect-[3/4] relative overflow-hidden">
          <Image
            src={anime.coverImage.extraLarge || anime.coverImage.large || "/placeholder.svg"}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {anime.averageScore && (
              <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {(anime.averageScore / 10).toFixed(1)}
              </div>
            )}
            {anime.episodes && (
              <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium">
                EP {anime.episodes}
              </div>
            )}
            {anime.format && (
              <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium">
                {anime.format}
              </div>
            )}
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold line-clamp-2 h-12">{title}</h3>
        </CardContent>
      </Card>
    </Link>
  )
}
