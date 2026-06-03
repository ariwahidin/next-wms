"use client"

import Layout from "@/components/layout"
import ReportRunnerCards from "@/components/report-builder/ReportRunnerCards"
import api from "@/lib/api"
import { Rpt2Template } from "@/types/rpt-builder/rpt-builder"
import useSWR from "swr"

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => res.data?.data ?? [])

export default function ReportRunnerPage() {
  const { data, isLoading } = useSWR<Rpt2Template[]>(
    "/rpt-builder/templates?active_only=true",
    fetcher
  )

  return (
    <Layout title="Reports" subTitle="Download Reports">
      <div className="p-4">
        <ReportRunnerCards data={data ?? []} loading={isLoading} />
      </div>
    </Layout>
  )
}