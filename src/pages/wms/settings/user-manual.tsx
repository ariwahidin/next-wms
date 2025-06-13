"use client"

import { useEffect } from "react"

export default function UserManualPage() {

    useEffect(() => {
        // redirect to user manual
        window.location.href = "https://www.notion.so/User-Manual-WMS-X-2116d98ce23e80438caaefd2535c3598"
    })
    return (
        <div>WMS - User Manual</div>
    )
}