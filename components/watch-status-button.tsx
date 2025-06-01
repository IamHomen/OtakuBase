"use client"

import { useState, useEffect } from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useFirebase } from "@/lib/firebase-provider"
import { updateWatchStatus, getWatchStatus } from "@/lib/firebase-db"
import { getAnimeTitle } from "@/lib/utils"

interface WatchStatusButtonProps {
  anime: any
}

type WatchStatus = "PLANNING" | "WATCHING" | "COMPLETED" | "DROPPED" | "PAUSED"

const statusLabels: Record<WatchStatus, string> = {
  PLANNING: "Plan to Watch",
  WATCHING: "Watching",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  PAUSED: "On Hold",
}

export function WatchStatusButton({ anime }: WatchStatusButtonProps) {
  const [status, setStatus] = useState<WatchStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useFirebase()
  const { toast } = useToast()

  useEffect(() => {
    const fetchWatchStatus = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const { data } = await getWatchStatus(user.uid, anime.id)
        if (data) {
          setStatus(data.status as WatchStatus)
        }
      } catch (error) {
        console.error("Error fetching watch status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWatchStatus()
  }, [anime.id, user])

  const handleUpdateStatus = async (newStatus: WatchStatus) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to update watch status",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await updateWatchStatus(user.uid, anime.id, newStatus)

      if (error) {
        throw new Error(error)
      }

      setStatus(newStatus)
      toast({
        title: "Status updated",
        description: `${getAnimeTitle(anime)} marked as ${statusLabels[newStatus]}`,
      })
    } catch (error: any) {
      console.error("Error updating watch status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update watch status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading} className="gap-1">
          <Eye className="h-4 w-4" />
          {status ? statusLabels[status] : "Add to List"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.entries(statusLabels).map(([key, label]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleUpdateStatus(key as WatchStatus)}
            className={status === key ? "bg-muted" : ""}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
