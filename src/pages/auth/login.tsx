import { LoginForm } from "@/components/ui/login-form"
import { useEffect } from "react"

export default function LoginPage() {

  useEffect (() => {
    document.title = 'WMS Login'
  })
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-6">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  )
}
