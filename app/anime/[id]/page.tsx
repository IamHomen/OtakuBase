import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink, Star, Calendar, Clock, Users, Info, Book } from "lucide-react"
import { getAnimeTitle, formatDate, getYouTubeEmbedUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FavoriteButton } from "@/components/favorite-button"
import { WatchStatusButton } from "@/components/watch-status-button"
import { CommentsSection } from "@/components/comments-section"
import { ScrollableTabsList } from "@/components/scrollable-tabs"
import { getComments } from "@/lib/firebase-db"
import { getUserProfile } from "@/lib/firebase-auth"

interface AnimePageProps {
  params: {
    id: string
  }
}

export default async function AnimePage({ params }: AnimePageProps) {
  const animeId = Number.parseInt(params.id)

  if (isNaN(animeId)) {
    return notFound()
  }

  console.log("Anime page - fetching comments for ID:", animeId)

  // Fetch comments for this anime
  const { data: comments, error: commentsError } = await getComments(animeId)

  if (commentsError) {
    console.error("Error fetching comments:", commentsError)
  }

  console.log("Anime page - received comments:", comments?.length || 0)

  // Fetch user profiles for comments
  let commentsWithProfiles = []
  if (comments && comments.length > 0) {
    // Get unique user IDs from comments
    const userIds = [...new Set(comments.map((comment) => comment.userId))]

    console.log("Fetching profiles for user IDs:", userIds)

    // Fetch profiles for these users
    const profiles = await Promise.all(userIds.map((userId) => getUserProfile(userId)))

    // Create a map of user IDs to profiles for quick lookup
    const profileMap = new Map()
    profiles.forEach((profile) => {
      if (profile) {
        profileMap.set(profile.uid, {
          id: profile.uid,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
        })
      }
    })

    // Combine comments with their author profiles
    commentsWithProfiles = comments.map((comment) => {
      const profile = profileMap.get(comment.userId)
      return {
        ...comment,
        profiles: profile || null,
      }
    })

    console.log("Comments with profiles:", commentsWithProfiles.length)
  }

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id
              title {
                english
                romaji
                native
                userPreferred
              }
              coverImage {
                extraLarge
                large
                medium
                color
              }
              bannerImage
              description(asHtml: false)
              season
              seasonYear
              episodes
              duration
              status
              genres
              averageScore
              popularity
              startDate {
                year
                month
                day
              }
              endDate {
                year
                month
                day
              }
              format
              source
              studios {
                nodes {
                  id
                  name
                  isAnimationStudio
                }
              }
              characters(sort: ROLE) {
                edges {
                  node {
                    id
                    name {
                      full
                      native
                    }
                    image {
                      large
                      medium
                    }
                  }
                  role
                  voiceActors {
                    id
                    name {
                      full
                      native
                    }
                    image {
                      large
                      medium
                    }
                    languageV2
                  }
                }
              }
              staff {
                edges {
                  node {
                    id
                    name {
                      full
                      native
                    }
                    image {
                      large
                      medium
                    }
                  }
                  role
                }
              }
              relations {
                edges {
                  node {
                    id
                    title {
                      english
                      romaji
                      native
                      userPreferred
                    }
                    coverImage {
                      medium
                      large
                      extraLarge
                    }
                    type
                    format
                    episodes
                  }
                  relationType
                }
              }
              recommendations {
                nodes {
                  mediaRecommendation {
                    id
                    title {
                      english
                      romaji
                      native
                      userPreferred
                    }
                    coverImage {
                      medium
                      large
                      extraLarge
                    }
                    type
                  }
                }
              }
              trailer {
                id
                site
                thumbnail
              }
              externalLinks {
                id
                url
                site
                type
                language
                color
                icon
              }
              streamingEpisodes {
                title
                thumbnail
                url
                site
              }
            }
          }
        `,
        variables: { id: animeId },
      }),
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    const data = await response.json()

    // Check for errors in the response
    if (data.errors) {
      console.error("AniList API errors:", data.errors)
      return (
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-4">Anime Not Found</h1>
          <p>The anime you're looking for doesn't exist or couldn't be loaded.</p>
          <p className="text-muted-foreground mt-2">Error: {data.errors[0]?.message || "Unknown error"}</p>
          <Button asChild className="mt-4">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      )
    }

    if (!data.data || !data.data.Media) {
      console.error("No anime data found for ID:", animeId)
      return (
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-4">Anime Not Found</h1>
          <p>The anime you're looking for doesn't exist or couldn't be loaded.</p>
          <Button asChild className="mt-4">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      )
    }

    const anime = data.data.Media

    const title = getAnimeTitle(anime)
    const mainCharacters = anime.characters.edges.filter((edge) => edge.role === "MAIN").slice(0, 8)
    const supportingCharacters = anime.characters.edges.filter((edge) => edge.role === "SUPPORTING").slice(0, 12)
    const directors = anime.staff.edges.filter((edge) => edge.role.toLowerCase().includes("director"))
    const animationStudios = anime.studios.nodes.filter((studio) => studio.isAnimationStudio)

    // Add Gojo.wtf to external links
    const gojoLink = {
      id: 9999,
      url: `https://aniplaynow.live/anime/info/${animeId}`,
      site: "Aniplaynow.live",
      type: "STREAMING",
      language: "English",
      color: null,
      icon: null,
    }

    // Add Gojo.wtf to the beginning of external links if it exists
    const externalLinks = [gojoLink, ...(anime.externalLinks || [])]

    return (
      <div className="pb-16">
        {/* Banner */}
        {anime.bannerImage && (
          <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden">
            <Image src={anime.bannerImage || "/placeholder.svg"} alt={title} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="sticky top-20">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-lg">
                  <Image
                    src={anime.coverImage.extraLarge || anime.coverImage.large}
                    alt={title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <FavoriteButton anime={anime} />
                    <WatchStatusButton anime={anime} />
                  </div>

                  {anime.trailer && anime.trailer.site === "youtube" && (
                    <Button asChild variant="outline" className="w-full">
                      <Link
                        href={`https://www.youtube.com/watch?v=${anime.trailer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch Trailer
                      </Link>
                    </Button>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-medium">Information</h3>
                    <Separator />

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Format:</span>
                        <span>{anime.format || ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Episodes:</span>
                        <span>{anime.episodes ? `EP ${anime.episodes}` : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{anime.duration ? `${anime.duration} min` : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize">{anime.status.replace("_", " ").toLowerCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span>{formatDate(anime.startDate.year, anime.startDate.month, anime.startDate.day)}</span>
                      </div>
                      {anime.endDate.year && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span>{formatDate(anime.endDate.year, anime.endDate.month, anime.endDate.day)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Season:</span>
                        <span>
                          {anime.season && anime.seasonYear
                            ? `${anime.season.charAt(0) + anime.season.slice(1).toLowerCase()} ${anime.seasonYear}`
                            : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span>{anime.source ? anime.source.replace("_", " ").toLowerCase() : ""}</span>
                      </div>
                    </div>
                  </div>

                  {animationStudios.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Studios</h3>
                      <Separator />
                      <div className="flex flex-wrap gap-1">
                        {animationStudios.map((studio) => (
                          <Badge key={studio.id} variant="outline">
                            {studio.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {anime.genres && anime.genres.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Genres</h3>
                      <Separator />
                      <div className="flex flex-wrap gap-1">
                        {anime.genres.map((genre) => (
                          <Badge key={genre} variant="secondary">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {externalLinks && externalLinks.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium">External Links</h3>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        {externalLinks.map((link) => (
                          <Button key={link.id} asChild variant="outline" size="sm">
                            <Link href={link.url} target="_blank" rel="noopener noreferrer">
                              {link.site}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold">{title}</h1>
                  {anime.title.native && <p className="text-lg text-muted-foreground">{anime.title.native}</p>}

                  <div className="flex items-center gap-4 mt-2">
                    {anime.averageScore && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>{(anime.averageScore / 10).toFixed(1)}</span>
                      </div>
                    )}

                    {anime.seasonYear && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{anime.seasonYear}</span>
                      </div>
                    )}

                    {anime.episodes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>EP {anime.episodes}</span>
                      </div>
                    )}

                    {anime.popularity && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{anime.popularity.toLocaleString()} users</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      <span className="capitalize">{anime.status.replace("_", " ").toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="overview">
                  <ScrollableTabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="characters">Characters</TabsTrigger>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="related">Related</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                  </ScrollableTabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {anime.description && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Synopsis</h2>
                        <div
                          className="text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: anime.description }}
                        />
                      </div>
                    )}

                    {anime.trailer && anime.trailer.site === "youtube" && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Trailer</h2>
                        <div className="aspect-video overflow-hidden rounded-lg">
                          <iframe
                            src={getYouTubeEmbedUrl(anime.trailer.id)}
                            title={`${title} Trailer`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          ></iframe>
                        </div>
                      </div>
                    )}

                    {anime.streamingEpisodes && anime.streamingEpisodes.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Watch</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {anime.streamingEpisodes.slice(0, 4).map((episode, index) => (
                            <Link key={index} href={episode.url} target="_blank" rel="noopener noreferrer">
                              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                                <div className="aspect-video relative">
                                  <Image
                                    src={episode.thumbnail || "/placeholder.svg"}
                                    alt={episode.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium truncate">{episode.title}</span>
                                    <Badge>{episode.site}</Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {anime.recommendations && anime.recommendations.nodes.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Recommendations</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {anime.recommendations.nodes.slice(0, 5).map((recommendation) => (
                            <Link
                              key={recommendation.mediaRecommendation.id}
                              href={`/anime/${recommendation.mediaRecommendation.id}`}
                            >
                              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                                <div className="aspect-[3/4] relative">
                                  <Image
                                    src={
                                      recommendation.mediaRecommendation.coverImage.extraLarge ||
                                      recommendation.mediaRecommendation.coverImage.large ||
                                      "/placeholder.svg" ||
                                      "/placeholder.svg" ||
                                      "/placeholder.svg"
                                    }
                                    alt={getAnimeTitle(recommendation.mediaRecommendation)}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <CardContent className="p-3">
                                  <p className="font-medium line-clamp-2 text-sm">
                                    {getAnimeTitle(recommendation.mediaRecommendation)}
                                  </p>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="characters" className="space-y-6">
                    {mainCharacters.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Main Characters</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {mainCharacters.map((character) => (
                            <Card
                              key={character.node.id}
                              className="overflow-hidden h-full transition-all hover:scale-[1.02] hover:shadow-md"
                            >
                              <div className="aspect-[3/4] relative overflow-hidden">
                                <Image
                                  src={character.node.image.large || character.node.image.medium || "/placeholder.svg"}
                                  alt={character.node.name.full}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium">
                                    {character.role}
                                  </div>
                                </div>
                                {character.voiceActors && character.voiceActors.length > 0 && (
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-md px-2 py-1 text-xs">
                                      <p className="font-medium">{character.voiceActors[0].name.full}</p>
                                      <p className="text-muted-foreground text-xs">
                                        {character.voiceActors[0].languageV2}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <CardContent className="p-3">
                                <p className="font-semibold line-clamp-2 text-sm">{character.node.name.full}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {supportingCharacters.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Supporting Characters</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {supportingCharacters.map((character) => (
                            <Card
                              key={character.node.id}
                              className="overflow-hidden h-full transition-all hover:scale-[1.02] hover:shadow-md"
                            >
                              <div className="aspect-[3/4] relative overflow-hidden">
                                <Image
                                  src={character.node.image.large || character.node.image.medium || "/placeholder.svg"}
                                  alt={character.node.name.full}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium">
                                    {character.role}
                                  </div>
                                </div>
                                {character.voiceActors && character.voiceActors.length > 0 && (
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-md px-2 py-1 text-xs">
                                      <p className="font-medium">{character.voiceActors[0].name.full}</p>
                                      <p className="text-muted-foreground text-xs">
                                        {character.voiceActors[0].languageV2}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <CardContent className="p-3">
                                <p className="font-semibold line-clamp-2 text-sm">{character.node.name.full}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="staff" className="space-y-6">
                    {directors.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Directors</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {directors.map((staff) => (
                            <Card
                              key={staff.node.id}
                              className="overflow-hidden h-full transition-all hover:scale-[1.02] hover:shadow-md"
                            >
                              <div className="aspect-[3/4] relative overflow-hidden">
                                <Image
                                  src={staff.node.image.large || staff.node.image.medium || "/placeholder.svg"}
                                  alt={staff.node.name.full}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute bottom-2 left-2 right-2">
                                  <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-md px-2 py-1 text-xs">
                                    <p className="text-muted-foreground">{staff.role}</p>
                                  </div>
                                </div>
                              </div>
                              <CardContent className="p-3">
                                <p className="font-semibold line-clamp-2 text-sm">{staff.node.name.full}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">Staff</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {anime.staff.edges.slice(0, 12).map((staff) => (
                          <Card
                            key={staff.node.id}
                            className="overflow-hidden h-full transition-all hover:scale-[1.02] hover:shadow-md"
                          >
                            <div className="aspect-[3/4] relative overflow-hidden">
                              <Image
                                src={staff.node.image.large || staff.node.image.medium || "/placeholder.svg"}
                                alt={staff.node.name.full}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute bottom-2 left-2 right-2">
                                <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-md px-2 py-1 text-xs">
                                  <p className="text-muted-foreground">{staff.role}</p>
                                </div>
                              </div>
                            </div>
                            <CardContent className="p-3">
                              <p className="font-semibold line-clamp-2 text-sm">{staff.node.name.full}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="related" className="space-y-6">
                    {anime.relations && anime.relations.edges.length > 0 && (
                      <div className="space-y-4">
                        {[
                          "PREQUEL",
                          "SEQUEL",
                          "SIDE_STORY",
                          "PARENT",
                          "ADAPTATION",
                          "ALTERNATIVE",
                          "SPIN_OFF",
                          "OTHER",
                        ].map((relationType) => {
                          const relations = anime.relations.edges.filter((edge) => edge.relationType === relationType)
                          if (relations.length === 0) return null

                          return (
                            <div key={relationType} className="space-y-2">
                              <h2 className="text-xl font-semibold">{relationType.replace("_", " ").toLowerCase()}</h2>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {relations.map((relation) => (
                                  <Link
                                    key={relation.node.id}
                                    href={
                                      relation.node.type === "MANGA"
                                        ? `/manga/${relation.node.id}`
                                        : `/anime/${relation.node.id}`
                                    }
                                  >
                                    <Card className="overflow-hidden h-full transition-all hover:scale-[1.02] hover:shadow-md">
                                      <div className="aspect-[3/4] relative overflow-hidden">
                                        <Image
                                          src={
                                            relation.node.coverImage.extraLarge ||
                                            relation.node.coverImage.large ||
                                            relation.node.coverImage.medium ||
                                            "/placeholder.svg" ||
                                            "/placeholder.svg" ||
                                            "/placeholder.svg"
                                          }
                                          alt={getAnimeTitle(relation.node)}
                                          fill
                                          className="object-cover"
                                        />
                                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                          {relation.node.format && (
                                            <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium">
                                              {relation.node.format}
                                            </div>
                                          )}
                                          {relation.node.type && (
                                            <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium">
                                              {relation.node.type}
                                            </div>
                                          )}
                                          {relation.node.type === "MANGA" && relation.node.episodes && (
                                            <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
                                              <Book className="h-3 w-3" />
                                              {relation.node.episodes} ch
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <CardContent className="p-3">
                                        <p className="font-semibold line-clamp-2 text-sm">
                                          {getAnimeTitle(relation.node)}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="comments" className="space-y-6 pt-4">
                    <CommentsSection
                      animeId={animeId}
                      comments={commentsWithProfiles || []}
                      currentUser={null}
                      mediaType="anime"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching anime details:", error)
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p>Failed to load anime details. Please try again later.</p>
        <Button asChild className="mt-4">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    )
  }
}
