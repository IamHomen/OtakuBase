export interface Anime {
  id: number
  title: {
    english: string | null
    romaji: string | null
    native: string | null
    userPreferred: string | null
  }
  coverImage: {
    extraLarge: string
    large: string
    medium: string
    color: string | null
  }
  bannerImage: string | null
  description: string | null
  season: string | null
  seasonYear: number | null
  episodes: number | null
  duration: number | null
  status: string
  genres: string[]
  averageScore: number | null
  popularity: number | null
  startDate: {
    year: number | null
    month: number | null
    day: number | null
  }
  endDate: {
    year: number | null
    month: number | null
    day: number | null
  }
  format: string | null
  source: string | null
  studios: {
    nodes: {
      id: number
      name: string
      isAnimationStudio: boolean
    }[]
  }
  characters: {
    edges: {
      node: {
        id: number
        name: {
          full: string
          native: string | null
        }
        image: {
          large: string
          medium: string
        }
      }
      role: string
      voiceActors: {
        id: number
        name: {
          full: string
          native: string | null
        }
        image: {
          large: string
          medium: string
        }
        languageV2: string
      }[]
    }[]
  }
  staff: {
    edges: {
      node: {
        id: number
        name: {
          full: string
          native: string | null
        }
        image: {
          large: string
          medium: string
        }
      }
      role: string
    }[]
  }
  relations: {
    edges: {
      node: {
        id: number
        title: {
          english: string | null
          romaji: string | null
          native: string | null
          userPreferred: string | null
        }
        coverImage: {
          medium: string
          large?: string
          extraLarge?: string
        }
        type: string
        format: string
        episodes?: number | null
      }
      relationType: string
    }[]
  }
  recommendations: {
    nodes: {
      mediaRecommendation: {
        id: number
        title: {
          english: string | null
          romaji: string | null
          native: string | null
          userPreferred: string | null
        }
        coverImage: {
          medium: string
          large?: string
          extraLarge?: string
        }
        type?: string
      }
    }[]
  }
  trailer: {
    id: string
    site: string
    thumbnail: string
  } | null
  externalLinks: {
    id: number
    url: string
    site: string
    type: string
    language: string | null
    color: string | null
    icon: string | null
  }[]
  streamingEpisodes: {
    title: string
    thumbnail: string
    url: string
    site: string
  }[]
}

export interface AnimePreview {
  id: number
  title: {
    english: string | null
    romaji: string | null
    native: string | null
    userPreferred: string | null
  }
  coverImage: {
    extraLarge: string
    large: string
    medium: string
    color: string | null
  }
  bannerImage: string | null
  season: string | null
  seasonYear: number | null
  episodes: number | null
  status: string
  genres: string[]
  averageScore: number | null
  format: string | null
  type?: string
}

export interface MangaPreview {
  id: number
  title: {
    english: string | null
    romaji: string | null
    native: string | null
    userPreferred: string | null
  }
  coverImage: {
    extraLarge: string
    large: string
    medium: string
    color: string | null
  }
  bannerImage: string | null
  status: string
  genres: string[]
  averageScore: number | null
  format: string | null
  type: string
  chapters: number | null
  volumes: number | null
}

export interface PageInfo {
  total: number
  currentPage: number
  lastPage: number
  hasNextPage: boolean
  perPage: number
}

export interface AnimeListResponse {
  Page: {
    pageInfo: PageInfo
    media: AnimePreview[]
  }
}

export interface AnimeResponse {
  Media: Anime
}

export interface SearchParams {
  search?: string
  genre?: string
  year?: number
  season?: string
  format?: string
  status?: string
  sort?: string
  page?: number
  perPage?: number
  type?: string
}

export async function fetchPopularAnime(page = 1, perPage = 20): Promise<AnimeListResponse> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(sort: POPULARITY_DESC, type: ANIME) {
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
          season
          seasonYear
          episodes
          status
          genres
          averageScore
          format
          type
        }
      }
    }
  `

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { page, perPage },
    }),
    cache: "force-cache",
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  const data = await response.json()
  return data.data
}

export async function fetchTrendingAnime(page = 1, perPage = 20): Promise<AnimeListResponse> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(sort: TRENDING_DESC, type: ANIME) {
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
          season
          seasonYear
          episodes
          status
          genres
          averageScore
          format
          type
        }
      }
    }
  `

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { page, perPage },
    }),
    cache: "force-cache",
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  const data = await response.json()
  return data.data
}

export async function fetchSeasonalAnime(page = 1, perPage = 20): Promise<AnimeListResponse> {
  // Get current season
  const date = new Date()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  let season = "WINTER"
  if (month >= 3 && month <= 5) season = "SPRING"
  else if (month >= 6 && month <= 8) season = "SUMMER"
  else if (month >= 9 && month <= 11) season = "FALL"

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
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
          season
          seasonYear
          episodes
          status
          genres
          averageScore
          format
          type
        }
      }
    }
  `

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { page, perPage, season, seasonYear: year },
    }),
    cache: "force-cache",
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  const data = await response.json()
  return data.data
}

export async function searchAnime(params: SearchParams): Promise<AnimeListResponse> {
  const {
    search = "",
    genre = "",
    year,
    season = "",
    format = "",
    status = "",
    sort = "POPULARITY_DESC",
    page = 1,
    perPage = 20,
    type = "ANIME",
  } = params

  // Build variables object
  const variables: any = { page, perPage, type }
  if (search) variables.search = search
  if (genre) variables.genre = genre
  if (year) variables.year = year
  if (season) variables.season = season
  if (format) variables.format = format
  if (status) variables.status = status
  if (sort) variables.sort = sort

  const query = `
    query ($page: Int, $perPage: Int, $search: String, $genre: String, $year: Int, $season: MediaSeason, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort], $type: MediaType) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(search: $search, genre: $genre, seasonYear: $year, season: $season, format: $format, status: $status, sort: [$sort], type: $type) {
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
          season
          seasonYear
          episodes
          status
          genres
          averageScore
          format
          type
          ... on Manga {
            chapters
            volumes
          }
        }
      }
    }
  `

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: "no-store", // Don't cache search results
  })

  const data = await response.json()
  return data.data
}

export async function fetchUpcomingAnime(page = 1, perPage = 20): Promise<AnimeListResponse> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(status: NOT_YET_RELEASED, type: ANIME, sort: POPULARITY_DESC) {
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
          season
          seasonYear
          episodes
          status
          genres
          averageScore
          format
          type
        }
      }
    }
  `

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { page, perPage },
    }),
    cache: "force-cache",
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  const data = await response.json()
  return data.data
}

export async function fetchAnimeDetails(id: number): Promise<AnimeResponse> {
  const query = `
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
  `

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { id },
    }),
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  const data = await response.json()
  return data.data
}

export async function fetchMangaDetails(id: number): Promise<AnimeResponse> {
  const query = `
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
  `

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { id },
    }),
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  const data = await response.json()
  return data.data
}
