import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams

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
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Habayeho Ikosa</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-muted rounded-xl p-6 mb-6">
                {params?.error ? (
                  <p className="text-muted-foreground">Ikosa: {params.error}</p>
                ) : (
                  <p className="text-muted-foreground">Habayeho ikosa ritazwi. Ongera ugerageze.</p>
                )}
              </div>
              <div className="flex gap-3">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full h-12 bg-transparent">
                    Injira
                  </Button>
                </Link>
                <Link href="/auth/sign-up" className="flex-1">
                  <Button className="w-full h-12">Iyandikishe</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
