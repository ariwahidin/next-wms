/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/index.tsx
import Head from "next/head"
import { LoadingScreen } from "@/components/LoadingScreen"

export default function IndexPage() {
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

// Redirect via server — tapi hanya untuk user, bukan crawler
// Crawler tidak punya cookie → kita biarkan dia baca OG tag dulu
export async function getServerSideProps({ req }: any) {
  const token = req.cookies["wms-auth-token"]

  // Kalau ada token (user sungguhan) → redirect ke dashboard
  if (token) {
    return {
      redirect: {
        destination: "/wms/dashboard",
        permanent: false,
      },
    }
  }

  // Kalau tidak ada token (crawler atau user baru) → render halaman dengan OG tag
  return { props: {} }
}
// export default function IndexPage() {
//   return <OGImagePreview />
// }


