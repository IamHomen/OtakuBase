import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink, Star, Book, Bookmark, Users, Info, Clock } from "lucide-react"
import { getAnimeTitle, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FavoriteButton } from "@/components/favorite-button"
import { CommentsSection } from "@/components/comments-section"
import { ScrollableTabsList } from "@/components/scrollable-tabs"
import { getComments } from "@/lib/firebase-db"
import { getUserProfile } from "@/lib/firebase-auth"

interface MangaPageProps {
  params: {
    id: string
  }
}

export default async function MangaPage({ params }: MangaPageProps) {
  const mangaId = Number.parseInt(params.id)

  if (isNaN(mangaId)) {
    return notFound()
  }

  console.log("Manga page - fetching comments for ID:", mangaId)

  // Fetch comments for this manga (using mangaId, not animeId)
  const { data: comments, error: commentsError } = await getComments(mangaId)

  if (commentsError) {
    console.error("Error fetching comments:", commentsError)
  }

  console.log("Manga page - received comments:", comments?.length || 0)

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
            Media(id: $id, type: MANGA) {
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
              chapters
              volumes
              source
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
              externalLinks {
                id
                url
                site
                type
                language
                color
                icon
              }
            }
          }
        `,
        variables: { id: mangaId },
      }),
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    const data = await response.json()

    // Check for errors in the response
    if (data.errors) {
      console.error("AniList API errors:", data.errors)
      return (
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-4">Manga Not Found</h1>
          <p>The manga you're looking for doesn't exist or couldn't be loaded.</p>
          <p className="text-muted-foreground mt-2">Error: {data.errors[0]?.message || "Unknown error"}</p>
          <Button asChild className="mt-4">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      )
    }

    if (!data.data || !data.data.Media) {
      console.error("No manga data found for ID:", mangaId)
      return (
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-4">Manga Not Found</h1>
          <p>The manga you're looking for doesn't exist or couldn't be loaded.</p>
          <Button asChild className="mt-4">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      )
    }

    const manga = data.data.Media

    const title = getAnimeTitle(manga)
    const mainCharacters = manga.characters?.edges.filter((edge) => edge.role === "MAIN").slice(0, 8) || []
    const supportingCharacters = manga.characters?.edges.filter((edge) => edge.role === "SUPPORTING").slice(0, 12) || []
    const authors =
      manga.staff?.edges.filter(
        (edge) =>
          edge.role.toLowerCase().includes("story") ||
          edge.role.toLowerCase().includes("author") ||
          edge.role.toLowerCase().includes("original"),
      ) || []
    const artists =
      manga.staff?.edges.filter(
        (edge) => edge.role.toLowerCase().includes("art") || edge.role.toLowerCase().includes("illustrat"),
      ) || []

    return (
      <div className="pb-16">
        {/* Banner */}
        {manga.bannerImage && (
          <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden">
            <Image src={manga.bannerImage || "/placeholder.svg"} alt={title} fill className="object-cover" priority />
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
                    src={manga.coverImage.extraLarge || manga.coverImage.large}
                    alt={title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <FavoriteButton anime={manga} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Information</h3>
                    <Separator />

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Format:</span>
                        <span>{manga.format || ""}</span>
                      </div>
                      {manga.chapters && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Chapters:</span>
                          <span>{manga.chapters}</span>
                        </div>
                      )}
                      {manga.volumes && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Volumes:</span>
                          <span>{manga.volumes}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize">{manga.status.replace("_", " ").toLowerCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span>{formatDate(manga.startDate.year, manga.startDate.month, manga.startDate.day)}</span>
                      </div>
                      {manga.endDate.year && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span>{formatDate(manga.endDate.year, manga.endDate.month, manga.endDate.day)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span>{manga.source ? manga.source.replace("_", " ").toLowerCase() : ""}</span>
                      </div>
                    </div>
                  </div>

                  {manga.genres && manga.genres.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Genres</h3>
                      <Separator />
                      <div className="flex flex-wrap gap-1">
                        {manga.genres.map((genre) => (
                          <Badge key={genre} variant="secondary">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {manga.externalLinks && manga.externalLinks.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium">External Links</h3>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        {manga.externalLinks.map((link) => (
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
                  {manga.title.native && <p className="text-lg text-muted-foreground">{manga.title.native}</p>}

                  <div className="flex items-center gap-4 mt-2">
                    {manga.averageScore && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>{(manga.averageScore / 10).toFixed(1)}</span>
                      </div>
                    )}

                    {manga.chapters && (
                      <div className="flex items-center gap-1">
                        <Book className="h-4 w-4" />
                        <span>{manga.chapters} chapters</span>
                      </div>
                    )}

                    {manga.volumes && (
                      <div className="flex items-center gap-1">
                        <Bookmark className="h-4 w-4" />
                        <span>{manga.volumes} volumes</span>
                      </div>
                    )}

                    {manga.popularity && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{manga.popularity.toLocaleString()} users</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      <span className="capitalize">{manga.status.replace("_", " ").toLowerCase()}</span>
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
                    {manga.description && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Synopsis</h2>
                        <div
                          className="text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: manga.description }}
                        />
                      </div>
                    )}

                    {manga.recommendations && manga.recommendations.nodes.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Recommendations</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {manga.recommendations.nodes.slice(0, 5).map((recommendation) => (
                            <Link
                              key={recommendation.mediaRecommendation.id}
                              href={
                                recommendation.mediaRecommendation.type === "MANGA"
                                  ? `/manga/${recommendation.mediaRecommendation.id}`
                                  : `/anime/${recommendation.mediaRecommendation.id}`
                              }
                            >
                              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                                <div className="aspect-[3/4] relative">
                                  <Image
                                    src={
                                      recommendation.mediaRecommendation.coverImage.extraLarge ||
                                      recommendation.mediaRecommendation.coverImage.large ||
                                      "/placeholder.svg" ||
                                      "/placeholder.svg" ||
                                      "/placeholder.svg" ||
                                      "/placeholder.svg"
                                    }
                                    alt={getAnimeTitle(recommendation.mediaRecommendation)}
                                    fill
                                    className="object-cover"
                                  />
                                  {recommendation.mediaRecommendation.type && (
                                    <div className="absolute top-2 right-2">
                                      <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium">
                                        {recommendation.mediaRecommendation.type}
                                      </div>
                                    </div>
                                  )}
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
                    {authors.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Authors</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {authors.map((staff) => (
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

                    {artists.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Artists</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {artists.map((staff) => (
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
                        {manga.staff?.edges.slice(0, 12).map((staff) => (
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
                    {manga.relations && manga.relations.edges.length > 0 && (
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
                          const relations = manga.relations.edges.filter((edge) => edge.relationType === relationType)
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
                                          {relation.node.type === "ANIME" && relation.node.episodes && (
                                            <div className="bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {relation.node.episodes} ep
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
                      animeId={mangaId}
                      comments={commentsWithProfiles || []}
                      currentUser={null}
                      mediaType="manga"
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
    console.error("Error fetching manga details:", error)
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p>Failed to load manga details. Please try again later.</p>
        <Button asChild className="mt-4">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    )
  }
}
