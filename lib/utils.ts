import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Anime } from "./anilist-api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAnimeTitle(anime: Anime | { title: Anime["title"] }): string {
  return anime.title.english || anime.title.romaji || anime.title.userPreferred || anime.title.native || ""
}

export function formatDate(year?: number | null, month?: number | null, day?: number | null): string {
  if (!year) return ""

  const date = new Date(year, (month || 1) - 1, day || 1)

  if (!month) return year.toString()
  if (!day) return `${date.toLocaleString("default", { month: "short" })} ${year}`

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getYouTubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "FINISHED":
    case "COMPLETED":
      return "bg-green-500"
    case "RELEASING":
    case "WATCHING":
      return "bg-blue-500"
    case "NOT_YET_RELEASED":
    case "PLANNING":
      return "bg-yellow-500"
    case "CANCELLED":
    case "DROPPED":
      return "bg-red-500"
    case "HIATUS":
    case "PAUSED":
      return "bg-orange-500"
    default:
      return "bg-gray-500"
  }
}
