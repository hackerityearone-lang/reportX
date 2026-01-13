import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowDownToLine, ArrowUpFromLine, Plus, FileText } from "lucide-react"

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/dashboard/stock-in">
        <Button size="lg" className="gap-2 h-12 px-6">
          <ArrowDownToLine className="h-5 w-5" />
          <span>Ibyinjiye (Stock In)</span>
        </Button>
      </Link>
      <Link href="/dashboard/stock-out">
        <Button size="lg" variant="secondary" className="gap-2 h-12 px-6">
          <ArrowUpFromLine className="h-5 w-5" />
          <span>Ibisohotse (Stock Out)</span>
        </Button>
      </Link>
      <Link href="/dashboard/products">
        <Button size="lg" variant="outline" className="gap-2 h-12 px-6 bg-transparent">
          <Plus className="h-5 w-5" />
          <span>Igicuruzwa Gishya</span>
        </Button>
      </Link>
      <Link href="/dashboard/reports">
        <Button size="lg" variant="outline" className="gap-2 h-12 px-6 bg-transparent">
          <FileText className="h-5 w-5" />
          <span>Raporo</span>
        </Button>
      </Link>
    </div>
  )
}
