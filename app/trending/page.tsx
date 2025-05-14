import { Suspense } from "react"
import { fetchTrendingAnime } from "@/lib/anilist-api"
import { AnimeGrid } from "@/components/anime-grid"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Pagination } from "@/components/pagination"

interface TrendingPageProps {
  searchParams: { page?: string }
}

export default async function TrendingPage({ searchParams }: TrendingPageProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const trendingData = await fetchTrendingAnime(page, 20)
  const trendingAnime = trendingData.Page.media
  const pageInfo = trendingData.Page.pageInfo

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="text-3xl font-bold mb-6">Trending Anime</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <AnimeGrid animeList={trendingAnime} />
          <Pagination currentPage={page} totalPages={pageInfo.lastPage} hasNextPage={pageInfo.hasNextPage} />
        </Suspense>
      </div>
    </div>
  )
}
