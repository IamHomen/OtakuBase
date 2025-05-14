import { Suspense } from "react"
import { searchAnime } from "@/lib/anilist-api"
import { AnimeGrid } from "@/components/anime-grid"
import { LoadingSpinner } from "@/components/loading-spinner"
import { SearchFilters } from "@/components/search-filters"
import { Pagination } from "@/components/pagination"

interface SearchPageProps {
  searchParams: {
    q?: string
    genre?: string
    year?: string
    season?: string
    format?: string
    status?: string
    sort?: string
    page?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""
  const genre = searchParams.genre || ""
  const year = searchParams.year ? Number.parseInt(searchParams.year) : undefined
  const season = searchParams.season || ""
  const format = searchParams.format || ""
  const status = searchParams.status || ""
  const sort = searchParams.sort || "POPULARITY_DESC"
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1

  const searchData = await searchAnime({
    search: query,
    genre,
    year,
    season,
    format,
    status,
    sort,
    page,
    perPage: 20,
  })

  const searchResults = searchData.Page.media
  const pageInfo = searchData.Page.pageInfo

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground mb-6">
          {pageInfo.total > 0
            ? `Found ${pageInfo.total} results ${query ? `for "${query}"` : ""}`
            : `No results found ${query ? `for "${query}"` : ""}`}
        </p>

        <SearchFilters
          initialQuery={query}
          initialGenre={genre}
          initialYear={year}
          initialSeason={season}
          initialFormat={format}
          initialStatus={status}
          initialSort={sort}
        />

        <Suspense fallback={<LoadingSpinner />}>
          {searchResults.length > 0 ? (
            <>
              <AnimeGrid animeList={searchResults} />
              <Pagination currentPage={page} totalPages={pageInfo.lastPage} hasNextPage={pageInfo.hasNextPage} />
            </>
          ) : (
            <div className="text-center py-10">
              <p>No anime found matching your search criteria. Try different filters.</p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
