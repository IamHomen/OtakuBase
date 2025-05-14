import { Suspense } from "react"
import { fetchPopularAnime } from "@/lib/anilist-api"
import { AnimeGrid } from "@/components/anime-grid"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Pagination } from "@/components/pagination"

interface PopularPageProps {
  searchParams: { page?: string }
}

export default async function PopularPage({ searchParams }: PopularPageProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const popularData = await fetchPopularAnime(page, 20)
  const popularAnime = popularData.Page.media
  const pageInfo = popularData.Page.pageInfo

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="text-3xl font-bold mb-6">Popular Anime</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <AnimeGrid animeList={popularAnime} />
          <Pagination currentPage={page} totalPages={pageInfo.lastPage} hasNextPage={pageInfo.hasNextPage} />
        </Suspense>
      </div>
    </div>
  )
}
