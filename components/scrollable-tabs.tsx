"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { useRef, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TabsList } from "@/components/ui/tabs"

interface ScrollableTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
  children: React.ReactNode
}

export function ScrollableTabsList({ className, children, ...props }: ScrollableTabsListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.5

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
  }, [])

  // Also check on window resize
  useEffect(() => {
    window.addEventListener("resize", checkScrollButtons)
    return () => {
      window.removeEventListener("resize", checkScrollButtons)
    }
  }, [])

  return (
    <div className="relative">
      {showLeftButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Scroll left</span>
        </Button>
      )}

      <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide">
        <TabsList className={cn("w-max min-w-full", className)} {...props}>
          {children}
        </TabsList>
      </div>

      {showRightButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Scroll right</span>
        </Button>
      )}
    </div>
  )
}
