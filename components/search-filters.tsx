"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Filter, SortDesc, Calendar, Layers, Tag, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SearchFiltersProps {
  initialQuery?: string
  initialGenre?: string
  initialYear?: number
  initialSeason?: string
  initialFormat?: string
  initialStatus?: string
  initialSort?: string
}

export function SearchFilters({
  initialQuery = "",
  initialGenre = "",
  initialYear,
  initialSeason = "",
  initialFormat = "",
  initialStatus = "",
  initialSort = "POPULARITY_DESC",
}: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)
  const [genre, setGenre] = useState(initialGenre)
  const [year, setYear] = useState(initialYear?.toString() || "")
  const [season, setSeason] = useState(initialSeason)
  const [format, setFormat] = useState(initialFormat)
  const [status, setStatus] = useState(initialStatus)
  const [sort, setSort] = useState(initialSort)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const genres = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Ecchi",
    "Fantasy",
    "Horror",
    "Mahou Shoujo",
    "Mecha",
    "Music",
    "Mystery",
    "Psychological",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
    "Sports",
    "Supernatural",
    "Thriller",
  ]

  const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"]

  const formats = [
    { value: "TV", label: "TV Show" },
    { value: "MOVIE", label: "Movie" },
    { value: "OVA", label: "OVA" },
    { value: "ONA", label: "ONA" },
    { value: "SPECIAL", label: "Special" },
    { value: "MUSIC", label: "Music Video" },
  ]

  const statuses = [
    { value: "FINISHED", label: "Finished" },
    { value: "RELEASING", label: "Currently Airing" },
    { value: "NOT_YET_RELEASED", label: "Upcoming" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "HIATUS", label: "On Hiatus" },
  ]

  const sortOptions = [
    { value: "POPULARITY_DESC", label: "Popularity (High to Low)" },
    { value: "POPULARITY", label: "Popularity (Low to High)" },
    { value: "SCORE_DESC", label: "Score (High to Low)" },
    { value: "SCORE", label: "Score (Low to High)" },
    { value: "TRENDING_DESC", label: "Trending (High to Low)" },
    { value: "START_DATE_DESC", label: "Newest First" },
    { value: "START_DATE", label: "Oldest First" },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (query) params.set("q", query)
    if (genre) params.set("genre", genre)
    if (year) params.set("year", year)
    if (season) params.set("season", season)
    if (format) params.set("format", format)
    if (status) params.set("status", status)
    if (sort) params.set("sort", sort)

    router.push(`${pathname}?${params.toString()}`)
  }

  const resetFilters = () => {
    setQuery(initialQuery)
    setGenre("")
    setYear("")
    setSeason("")
    setFormat("")
    setStatus("")
    setSort("POPULARITY_DESC")

    const params = new URLSearchParams()
    if (initialQuery) params.set("q", initialQuery)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="mb-8">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder="Search anime..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {isFiltersOpen && (
          <div className="bg-card rounded-lg p-4 border mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Genre
                </Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="Any genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any genre</SelectItem>
                    {genres.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Year
                </Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="Any year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min={1940}
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Season
                </Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger id="season">
                    <SelectValue placeholder="Any season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any season</SelectItem>
                    {seasons.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Format
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Any format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any format</SelectItem>
                    {formats.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any status</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort" className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  Sort By
                </Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <Button type="button" variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button type="button" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
