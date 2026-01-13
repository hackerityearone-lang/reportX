"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

interface ReportsHeaderProps {
  title: string
  subtitle: string
}

export function ReportsHeader({ title, subtitle }: ReportsHeaderProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" />
          {title}
        </h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div>
        <Button 
          onClick={handlePrint}
          variant="default" 
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Print Reports
        </Button>
      </div>
    </div>
  )
}
