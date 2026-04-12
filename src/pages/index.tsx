"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/LoadingScreen"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Yutrack WMS",
  openGraph: {
    title: "Yutrack WMS",
    description: "Integrated Warehouse Management System",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

// export default function IndexPage() {
//   return <OGImagePreview />
// }

export default function LoadingPage() {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => {
      router.replace("/auth/login")
    }, 2000); // Simulate loading delay
  }, [router])

  return <LoadingScreen />
}
