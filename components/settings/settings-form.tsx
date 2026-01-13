"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Shield, LogOut } from "lucide-react"

interface SettingsFormProps {
  email: string
  fullName: string
  role: string
}

export function SettingsForm({ email, fullName, role }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState(fullName)
  const router = useRouter()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: name,
      },
    })

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    router.refresh()
    setIsLoading(false)

    setTimeout(() => setSuccess(false), 3000)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Amakuru y'Konti
          </CardTitle>
          <CardDescription>Hindura izina ryawe n'indi makuru</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled className="bg-secondary/50" />
              <p className="text-xs text-muted-foreground">Email ntishobora guhindurwa</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Amazina yose</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Andika amazina yawe"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                <p className="text-sm text-success">Amakuru yahinduwe neza!</p>
              </div>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tegereza...
                </>
              ) : (
                "Bika Amahinduka"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Role Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Uruhare
          </CardTitle>
          <CardDescription>Uruhare rwawe muri sisitemu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{role === "STOCK_BOSS" ? "Stock Boss" : "Umukozi (User)"}</p>
              <p className="text-sm text-muted-foreground">
                {role === "STOCK_BOSS"
                  ? "Ufite uburenganzira bwose bwo gucunga stock"
                  : "Ufite uburenganzira bwo gukoresha sisitemu"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Card */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <LogOut className="h-5 w-5" />
            Sohoka
          </CardTitle>
          <CardDescription>Sohoka muri konti yawe</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tegereza...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sohoka mu Konti
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
