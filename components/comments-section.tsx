"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { MessageCircle, Reply, Trash2, User } from "lucide-react"
import { useFirebase } from "@/lib/firebase-provider"
import { addCommentAction, addReplyAction, deleteCommentAction } from "@/app/actions/comment-actions"

interface Comment {
  id: string
  userId: string
  animeId: number
  content: string
  parentId?: string | null
  createdAt: Date
  updatedAt: Date
  profiles?: {
    id: string
    username: string
    avatarUrl: string
  } | null
}

interface CommentsSectionProps {
  animeId: number
  comments: Comment[]
  currentUser: any
  mediaType?: "anime" | "manga"
}

export function CommentsSection({ animeId, comments, currentUser, mediaType = "anime" }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  // Organize comments into parent and replies
  const parentComments = comments.filter((comment) => !comment.parentId)
  const getReplies = (parentId: string) => comments.filter((comment) => comment.parentId === parentId)

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)

    try {
      const result = await addCommentAction(animeId, newComment.trim(), user.uid, mediaType)

      if (result.error) {
        throw new Error(result.error)
      }

      setNewComment("")
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
      })

      // Refresh the page to show the new comment
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply",
        variant: "destructive",
      })
      return
    }

    if (!replyContent.trim()) return

    setIsSubmitting(true)

    try {
      const result = await addReplyAction(animeId, replyContent.trim(), parentId, user.uid, mediaType)

      if (result.error) {
        throw new Error(result.error)
      }

      setReplyContent("")
      setReplyingTo(null)
      toast({
        title: "Reply added",
        description: "Your reply has been posted successfully",
      })

      // Refresh the page to show the new reply
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add reply",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const result = await deleteCommentAction(commentId, animeId, user.uid, mediaType)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      })

      // Refresh the page to reflect the deletion
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const replies = getReplies(comment.id)
    const isCurrentUserComment = user && user.uid === comment.userId

    return (
      <div key={comment.id} className={`${isReply ? "ml-8 mt-3" : ""}`}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.profiles?.avatarUrl || "/placeholder.svg"}
                    alt={comment.profiles?.username || "User"}
                  />
                  <AvatarFallback>
                    {comment.profiles?.username ? (
                      comment.profiles.username.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{comment.profiles?.username || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                </div>
              </div>
              {user && user.uid === comment.userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm mb-3">{comment.content}</p>
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>

            {/* Reply form */}
            {replyingTo === comment.id && (
              <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4 space-y-3">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting || !replyContent.trim()}>
                    {isSubmitting ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              </form>
            )}

            {/* Replies */}
            {replies.length > 0 && (
              <div className="mt-4 space-y-3 border-l-2 border-muted pl-4">
                {replies.map((reply) => (
                  <div key={reply.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={reply.profiles?.avatarUrl || "/placeholder.svg"}
                            alt={reply.profiles?.username || "User"}
                          />
                          <AvatarFallback>
                            {reply.profiles?.username ? (
                              reply.profiles.username.charAt(0).toUpperCase()
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-xs">{reply.profiles?.username || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</p>
                        </div>
                      </div>
                      {user && user.uid === reply.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(reply.id)}
                          className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs ml-8">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* Add new comment */}
      {user ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder={`Share your thoughts about this ${mediaType}...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              <Button asChild variant="link" className="p-0 h-auto">
                <a href="/login">Sign in</a>
              </Button>{" "}
              to join the discussion
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {parentComments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            </CardContent>
          </Card>
        ) : (
          parentComments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  )
}
