"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Package, Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [role, setRole] = useState<"USER" | "STOCK_BOSS">("USER")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Amagambo y'ibanga ntabwo ahura")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Ijambo ry'ibanga rigomba kuba nibura inyuguti 6")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
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
              <CardTitle className="text-2xl">Iyandikishe</CardTitle>
              <CardDescription>Fungura konti nshya kugira ngo utangire</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-base">
                      Amazina yose
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jean Claude"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
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
                    <Label htmlFor="role" className="text-base">
                      Uruhare
                    </Label>
                    <Select value={role} onValueChange={(value: "USER" | "STOCK_BOSS") => setRole(value)}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Hitamo uruhare" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Umukozi (User)</SelectItem>
                        <SelectItem value="STOCK_BOSS">Umuyobozi w'Istock (Stock Boss)</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div className="grid gap-2">
                    <Label htmlFor="repeatPassword" className="text-base">
                      Subiramo ijambo ryibanga
                    </Label>
                    <Input
                      id="repeatPassword"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
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
                      "Iyandikishe"
                    )}
                  </Button>
                </div>
                <div className="mt-6 text-center text-base">
                  Usanzwe ufite konti?{" "}
                  <Link href="/auth/login" className="text-primary font-semibold hover:underline underline-offset-4">
                    Injira
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
