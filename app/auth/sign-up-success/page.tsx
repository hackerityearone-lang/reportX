import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
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
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Murakoze kwiyandikisha!</CardTitle>
              <CardDescription className="text-base">Reba email yawe kugira ngo wemeze konti yawe</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-muted rounded-xl p-6 mb-6">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Twohereje email yo kwemeza. Kanda ku link iri muri email kugira ngo utangire gukoresha Stock Manager.
                </p>
              </div>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full h-12 text-lg bg-transparent">
                  Subira ku Injira
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
