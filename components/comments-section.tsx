"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Reply, User, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { addComment, deleteComment, addReply } from "@/app/actions/comment-actions"

interface Comment {
  id: number
  user_id: string
  anime_id: number
  content: string
  created_at: string
  updated_at: string
  parent_id?: number | null
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

interface CommentsSectionProps {
  animeId: number
  comments: Comment[]
  currentUser: any
}

export function CommentsSection({ animeId, comments, currentUser }: CommentsSectionProps) {
  const [commentContent, setCommentContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  // Separate top-level comments and replies
  const topLevelComments = comments.filter((comment) => !comment.parent_id)
  const repliesMap = new Map<number, Comment[]>()

  comments
    .filter((comment) => comment.parent_id)
    .forEach((reply) => {
      if (reply.parent_id) {
        if (!repliesMap.has(reply.parent_id)) {
          repliesMap.set(reply.parent_id, [])
        }
        repliesMap.get(reply.parent_id)?.push(reply)
      }
    })

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentContent.trim()) {
      toast({
        title: "Comment cannot be empty",
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a comment",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await addComment(animeId, commentContent)

      if (result.error) {
        toast({
          title: "Failed to add comment",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully",
        })
        setCommentContent("")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      toast({
        title: "Reply cannot be empty",
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await addReply(animeId, replyContent, parentId)

      if (result.error) {
        toast({
          title: "Failed to add reply",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Reply added",
          description: "Your reply has been added successfully",
        })
        setReplyContent("")
        setReplyingTo(null)
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      const result = await deleteComment(commentId, animeId)

      if (result.error) {
        toast({
          title: "Failed to delete comment",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Comment deleted",
          description: "Your comment has been deleted successfully",
        })
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const replies = repliesMap.get(comment.id) || []
    const isCurrentUserComment = currentUser && currentUser.id === comment.user_id

    return (
      <div key={comment.id} className={`${isReply ? "ml-8 mt-3" : ""}`}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage
                  src={comment.profiles?.avatar_url || ""}
                  alt={comment.profiles?.username || "User"}
                  width={40}
                  height={40}
                />
                <AvatarFallback>
                  {comment.profiles?.username ? (
                    comment.profiles.username.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{comment.profiles?.username || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {currentUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        title="Reply to comment"
                      >
                        <Reply className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {isCurrentUserComment && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteComment(comment.id)}
                        title="Delete comment"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {replyingTo === comment.id && (
          <div className="ml-8 mt-3">
            <div className="flex gap-4 items-start">
              <Avatar className="mt-2">
                <AvatarImage
                  src={currentUser?.user_metadata?.avatar_url || ""}
                  alt={currentUser?.user_metadata?.username || currentUser?.email || "User"}
                  width={40}
                  height={40}
                />
                <AvatarFallback>
                  {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSubmitReply(comment.id)} disabled={isSubmitting || !replyContent.trim()}>
                    {isSubmitting ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {replies.length > 0 && (
          <div className="space-y-3 mt-3">{replies.map((reply) => renderComment(reply, true))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>

      {currentUser && (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex gap-4 items-start">
            <Avatar className="mt-2">
              <AvatarImage
                src={currentUser?.user_metadata?.avatar_url || ""}
                alt={currentUser?.user_metadata?.username || currentUser?.email || "User"}
                width={40}
                height={40}
              />
              <AvatarFallback>
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Add a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="min-h-[100px] flex-1"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !commentContent.trim()}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      )}

      {!currentUser && (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="mb-4">You need to be logged in to comment</p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {topLevelComments.length > 0 ? (
        <div className="space-y-4">{topLevelComments.map((comment) => renderComment(comment))}</div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
}
