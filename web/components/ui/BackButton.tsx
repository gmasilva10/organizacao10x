import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BackButtonProps {
  href: string
  label?: string
  className?: string
}

export default function BackButton({ href, label = "Voltar", className }: BackButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className={className}>
      <Link href={href} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
}
