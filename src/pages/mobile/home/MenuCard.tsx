"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from "react"

type MenuCardProps = {
  icon: ReactNode
  label: string
  href: string
}

export default function MenuCard({ icon, label, href }: MenuCardProps) {
  return (
    <Link href={href} className="w-full">
      <Card className="flex flex-col items-center justify-center p-4 aspect-square w-full">
        <CardContent className="flex flex-col items-center justify-center p-0">
          <div className="text-3xl mb-2">{icon}</div>
          <div className="text-sm font-medium text-center">{label}</div>
        </CardContent>
      </Card>
    </Link>
  )
}
