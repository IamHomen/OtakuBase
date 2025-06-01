"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type User, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase-config"

type FirebaseContext = {
  user: User | null
  loading: boolean
}

const Context = createContext<FirebaseContext | undefined>(undefined)

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return <Context.Provider value={{ user, loading }}>{children}</Context.Provider>
}

export const useFirebase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useFirebase must be used inside FirebaseProvider")
  }
  return context
}
