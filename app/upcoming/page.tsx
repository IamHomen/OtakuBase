import { Suspense } from "react"
import { fetchUpcomingAnime } from "@/lib/anilist-api"
import { AnimeGrid } from "@/components/anime-grid"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Pagination } from "@/components/pagination"

interface UpcomingPageProps {
  searchParams: { page?: string }
}

export default async function UpcomingPage({ searchParams }: UpcomingPageProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const upcomingData = await fetchUpcomingAnime(page, 20)
  const upcomingAnime = upcomingData.Page.media
  const pageInfo = upcomingData.Page.pageInfo

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="text-3xl font-bold mb-6">Upcoming Anime</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <AnimeGrid animeList={upcomingAnime} />
          <Pagination currentPage={page} totalPages={pageInfo.lastPage} hasNextPage={pageInfo.hasNextPage} />
        </Suspense>
      </div>
    </div>
  )
}
