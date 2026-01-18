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
  // Public signups are disabled. Account creation is handled by the boss (admin).
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 notebook-bg">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="shadow-lg border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign Up Disabled</CardTitle>
              <CardDescription>Public registration is disabled. Ask your manager or the system owner to create an account for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">For initial setup, create the Boss account using the server-side setup script or API. See README for details.</p>
                <div className="pt-4 text-center">
                  <Link href="/auth/login">
                    <Button>Return to Login</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
