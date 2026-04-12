"use client"

import Head from "next/head"
import { useEffect } from "react"
import { useRouter } from "next/router"  // bukan next/navigation!
import { LoadingScreen } from "@/components/LoadingScreen"

export default function LoadingPage() {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => {
      router.replace("/auth/login")
    }, 2000)
  }, [router])

  return (
    <>
      <Head>
        <title>Yutrack WMS</title>
        <meta property="og:title" content="Yutrack WMS" />
        <meta property="og:description" content="Integrated Warehouse Management System" />
        <meta property="og:image" content="https://wms.logspeedy.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wms.logspeedy.com" />
      </Head>
      <LoadingScreen />
    </>
  )
}

// export default function IndexPage() {
//   return <OGImagePreview />
// }


