"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AnimePreview } from "@/lib/anilist-api"
import { AnimeCard } from "@/components/anime-card"

interface ScrollableSectionProps {
  title: string
  description?: string
  animeList: AnimePreview[]
  viewAllLink?: string
}

export function ScrollableSection({ title, description, animeList, viewAllLink }: ScrollableSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.75

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    setShowLeftButton(container.scrollLeft > 0)
    setShowRightButton(container.scrollLeft < container.scrollWidth - container.clientWidth - 10)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollButtons)
      // Initial check
      checkScrollButtons()

      // Check if scrolling is needed at all
      setShowRightButton(container.scrollWidth > container.clientWidth)
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollButtons)
      }
    }
  }, [animeList])

  // Also check on window resize
  useEffect(() => {
    window.addEventListener("resize", checkScrollButtons)
    return () => {
      window.removeEventListener("resize", checkScrollButtons)
    }
  }, [])

  return (
    <section className="py-4">
      <div className="container">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {viewAllLink && (
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href={viewAllLink}>
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        <div className="relative group">
          <Button
            variant="secondary"
            size="icon"
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md opacity-90 hover:opacity-100 ${
              showLeftButton ? "visible" : "invisible"
            }`}
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Scroll left</span>
          </Button>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-3 md:gap-4 pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {animeList.map((anime) => (
              <div key={anime.id} className="flex-none w-[160px] sm:w-[180px] md:w-[200px]">
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="icon"
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md opacity-90 hover:opacity-100 ${
              showRightButton ? "visible" : "invisible"
            }`}
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>
      </div>
    </section>
  )
}
