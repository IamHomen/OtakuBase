import { AnimeCard } from "@/components/anime-card"
import type { AnimePreview } from "@/lib/anilist-api"

interface AnimeGridProps {
  animeList: AnimePreview[]
  title?: string
}

export function AnimeGrid({ animeList, title }: AnimeGridProps) {
  return (
    <section className="container py-4">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {animeList.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
    </section>
  )
}
