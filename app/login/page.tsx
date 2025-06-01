"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useFirebase } from "@/lib/firebase-provider"
import { signIn, signUp } from "@/lib/firebase-auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase-config"
import { getRandomDefaultAvatar } from "@/app/actions/avatar-actions"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useFirebase()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { user, error } = await signIn(email, password)

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
      })

      router.push("/")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Failed to log in",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatarToFirebase = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `avatars/avatar-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const storageRef = ref(storage, fileName)

      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      })

      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error("Error uploading to Firebase:", error)
      // Return default avatar if upload fails
      return await getRandomDefaultAvatar()
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let avatarUrl = ""

      // Handle avatar upload or get default
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0]

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed")
        }

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          throw new Error("File size must be less than 2MB")
        }

        avatarUrl = await uploadAvatarToFirebase(file)
      } else {
        avatarUrl = await getRandomDefaultAvatar()
      }

      const { user, error } = await signUp(email, password, username, avatarUrl)

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully",
      })

      router.push("/")
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Avatar image must be less than 2MB",
          variant: "destructive",
        })
        e.target.value = ""
        setAvatarPreview(null)
        return
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive",
        })
        e.target.value = ""
        setAvatarPreview(null)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setAvatarPreview(null)
    }
  }

  const clearAvatarPreview = () => {
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account or create a new one</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your email and password to login to your account</CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Register</CardTitle>
                <CardDescription>Create a new account to get started</CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                        {avatarPreview ? (
                          <>
                            <Image
                              src={avatarPreview || "/placeholder.svg"}
                              alt="Avatar preview"
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={clearAvatarPreview}
                              className="absolute right-0 top-0 rounded-full bg-background p-1 shadow-sm"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Clear avatar</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          id="avatar"
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          {avatarPreview ? "Change Avatar" : "Upload Avatar"}
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {avatarPreview
                            ? "Click to change your avatar"
                            : "Upload an avatar or we'll assign you a random one"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
