import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Package, TrendingUp, CreditCard, BarChart3 } from "lucide-react"
import { HomePageProducts } from "@/components/home-page-products"
import { HomePageHeader } from "@/components/home-page-header"

export default async function HomePage() {
  return (
    <div className="min-h-screen notebook-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Language Context */}
        <HomePageHeader />

        {/* Hero Section */}
        <section className="text-center py-16 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
          KQS LTD
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            Modern stock management platform with comprehensive reporting tools. Track inventory, sales, credits, and generate
            detailed reports.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-xl px-8 py-6 bg-primary hover:bg-primary/90">
              Get Started Now
            </Button>
          </Link>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <FeatureCard
            icon={<Package className="w-8 h-8" />}
            title="Stock In"
            description="Record and track incoming stock efficiently"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Stock Out"
            description="Monitor outgoing stock and sales"
          />
          <FeatureCard
            icon={<CreditCard className="w-8 h-8" />}
            title="Credits"
            description="Manage credits and outstanding payments"
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Reports"
            description="Generate comprehensive business reports"
          />
        </section>

        {/* Products from Database */}
        <HomePageProducts />

        {/* Footer */}
        <footer className="mt-16 text-center text-muted-foreground border-t pt-8">
          <p>© 2026 ReportX Stock - Professional Stock Management System</p>
          <p className="text-sm mt-2">Built by Patrick NIYONSENGA</p>
        </footer>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
