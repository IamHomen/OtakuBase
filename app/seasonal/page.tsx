import { Suspense } from "react"
import { fetchSeasonalAnime } from "@/lib/anilist-api"
import { AnimeGrid } from "@/components/anime-grid"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Pagination } from "@/components/pagination"

interface SeasonalPageProps {
  searchParams: { page?: string }
}

export default async function SeasonalPage({ searchParams }: SeasonalPageProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const seasonalData = await fetchSeasonalAnime(page, 20)
  const seasonalAnime = seasonalData.Page.media
  const pageInfo = seasonalData.Page.pageInfo

  // Get current season and year
  const date = new Date()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  let season = "Winter"
  if (month >= 3 && month <= 5) season = "Spring"
  else if (month >= 6 && month <= 8) season = "Summer"
  else if (month >= 9 && month <= 11) season = "Fall"

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="text-3xl font-bold mb-6">{`${season} ${year} Anime`}</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <AnimeGrid animeList={seasonalAnime} />
          <Pagination currentPage={page} totalPages={pageInfo.lastPage} hasNextPage={pageInfo.hasNextPage} />
        </Suspense>
      </div>
    </div>
  )
}
