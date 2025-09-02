"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import LocationGenerator from "@/components/LocationGenerator"

export default function Home() {
  const [locationCount, setLocationCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const updateLocationCount = () => {
      const stored = localStorage.getItem("locationCodes")
      const locations = stored ? JSON.parse(stored) : []
      setLocationCount(locations.length)
    }

    updateLocationCount()

    // Listen for storage changes
    window.addEventListener("storage", updateLocationCount)

    // Custom event for when locations are updated within the same tab
    window.addEventListener("locationsUpdated", updateLocationCount)

    return () => {
      window.removeEventListener("storage", updateLocationCount)
      window.removeEventListener("locationsUpdated", updateLocationCount)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Storage Location Manager</h1>
          <div className="flex gap-3">
            <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Settings className="w-4 h-4 mr-2" />
              Generate Location ({locationCount})
            </Button>
          </div>
        </div>

        <LocationGenerator isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  )
}
