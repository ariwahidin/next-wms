"use client"

import type React from "react"

interface BasicLoadingOverlayProps {
  isLoading: boolean
  message?: string
}

const BasicLoadingOverlay: React.FC<BasicLoadingOverlayProps> = ({ isLoading, message = "Loading..." }) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-card p-6 shadow-lg">
        {/* Simple spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>

        {/* Loading message */}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export default BasicLoadingOverlay
