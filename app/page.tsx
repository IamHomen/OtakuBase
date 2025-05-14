import { Suspense } from "react"
import { fetchPopularAnime, fetchTrendingAnime, fetchSeasonalAnime, fetchUpcomingAnime } from "@/lib/anilist-api"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ScrollableSection } from "@/components/scrollable-section"

export default async function Home() {
  const popularData = await fetchPopularAnime(1, 20)
  const trendingData = await fetchTrendingAnime(1, 20)
  const seasonalData = await fetchSeasonalAnime(1, 20)
  const upcomingData = await fetchUpcomingAnime(1, 20)

  const popularAnime = popularData.Page.media
  const trendingAnime = trendingData.Page.media
  const seasonalAnime = seasonalData.Page.media
  const upcomingAnime = upcomingData.Page.media

  // Get current season and year
  const date = new Date()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  let season = "Winter"
  if (month >= 3 && month <= 5) season = "Spring"
  else if (month >= 6 && month <= 8) season = "Summer"
  else if (month >= 9 && month <= 11) season = "Fall"

  return (
    <div className="pb-10">
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Discover Anime</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore comprehensive information about your favorite anime series and discover new ones
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<LoadingSpinner />}>
        <ScrollableSection
          title="Trending Now"
          description="The hottest anime everyone is watching"
          animeList={trendingAnime}
          viewAllLink="/trending"
        />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <ScrollableSection
          title="Upcoming Anime"
          description="Anime to look forward to"
          animeList={upcomingAnime}
          viewAllLink="/upcoming"
        />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <ScrollableSection
          title={`${season} ${year} Anime`}
          description="Currently airing this season"
          animeList={seasonalAnime}
          viewAllLink="/seasonal"
        />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <ScrollableSection
          title="Popular Anime"
          description="All-time favorites"
          animeList={popularAnime}
          viewAllLink="/popular"
        />
      </Suspense>
    </div>
  )
}
