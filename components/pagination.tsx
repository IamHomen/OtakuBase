"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
}

export function Pagination({ currentPage, totalPages, hasNextPage }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  // Generate page numbers to display
  const generatePagination = () => {
    // If there are 7 or fewer pages, show all pages
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Always include first and last page
    const firstPage = 1
    const lastPage = totalPages

    // Calculate middle pages
    const leftBoundary = Math.max(currentPage - 1, firstPage)
    const rightBoundary = Math.min(currentPage + 1, lastPage)

    const pages = [firstPage]

    // Add ellipsis if needed
    if (leftBoundary > firstPage + 1) {
      pages.push("ellipsis-left")
    } else if (leftBoundary === firstPage + 1) {
      pages.push(firstPage + 1)
    }

    // Add middle pages
    for (let i = leftBoundary; i <= rightBoundary; i++) {
      if (i !== firstPage && i !== lastPage) {
        pages.push(i)
      }
    }

    // Add ellipsis if needed
    if (rightBoundary < lastPage - 1) {
      pages.push("ellipsis-right")
    } else if (rightBoundary === lastPage - 1) {
      pages.push(lastPage - 1)
    }

    if (lastPage !== firstPage) {
      pages.push(lastPage)
    }

    return pages
  }

  const pages = generatePagination()

  return (
    <div className="flex justify-center my-8">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        {pages.map((page, i) => {
          if (page === "ellipsis-left" || page === "ellipsis-right") {
            return (
              <Button key={`${page}-${i}`} variant="outline" size="icon" disabled>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More pages</span>
              </Button>
            )
          }

          return (
            <Button
              key={`${page}-${i}`}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => router.push(createPageURL(page))}
              className="hidden sm:inline-flex"
            >
              {page}
            </Button>
          )
        })}

        <div className="sm:hidden">
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(currentPage + 1))}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  )
}
