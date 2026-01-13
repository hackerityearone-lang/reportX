"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Package, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Habayeho ikosa")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 notebook-bg">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">Stock Manager</h1>
              <p className="text-sm text-muted-foreground">Gucunga Ibicuruzwa</p>
            </div>
          </div>

          <Card className="shadow-lg border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Injira</CardTitle>
              <CardDescription>Andika email n'ijambo ryibanga kugira ngo winjire</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-base">
                      Ijambo ryibanga
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Tegereza...
                      </>
                    ) : (
                      "Injira"
                    )}
                  </Button>
                </div>
                <div className="mt-6 text-center text-base">
                  Nta konti ufite?{" "}
                  <Link href="/auth/sign-up" className="text-primary font-semibold hover:underline underline-offset-4">
                    Iyandikishe
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary hover:underline">
              Subira ku rupapuro rw'ibanze
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
