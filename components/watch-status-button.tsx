"use client"

import { useState, useEffect } from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
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
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  const { supabase: supabaseClient } = useSupabase()
  const supabase = supabaseClient

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data } = await supabase
            .from("watch_status")
            .select("status")
            .eq("user_id", user.id)
            .eq("anime_id", anime.id)
            .single()

          if (data) {
            setStatus(data.status as WatchStatus)
          }
        }
      } catch (error) {
        console.error("Error fetching user or watch status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [anime.id, supabase])

  const updateStatus = async (newStatus: WatchStatus) => {
    if (!supabase) {
      toast({
        title: "Service unavailable",
        description: "The watch status service is currently unavailable",
        variant: "destructive",
      })
      return
    }

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
      if (status) {
        // Update existing status
        await supabase
          .from("watch_status")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("anime_id", anime.id)
      } else {
        // Insert new status
        await supabase.from("watch_status").insert({
          user_id: user.id,
          anime_id: anime.id,
          status: newStatus,
          progress: 0,
        })
      }

      setStatus(newStatus)
      toast({
        title: "Status updated",
        description: `${getAnimeTitle(anime)} marked as ${statusLabels[newStatus]}`,
      })
    } catch (error) {
      console.error("Error updating watch status:", error)
      toast({
        title: "Error",
        description: "Failed to update watch status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading || !supabase} className="gap-1">
          <Eye className="h-4 w-4" />
          {status ? statusLabels[status] : "Add to List"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.entries(statusLabels).map(([key, label]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => updateStatus(key as WatchStatus)}
            className={status === key ? "bg-muted" : ""}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
