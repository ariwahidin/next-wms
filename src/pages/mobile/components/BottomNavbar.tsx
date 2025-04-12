// components/BottomNavbar.tsx
import { Home, Menu, User } from "lucide-react"

export default function BottomNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around items-center shadow-md">
      <div className="flex flex-col items-center text-sm text-gray-700">
        <Home className="w-5 h-5" />
        Home
      </div>
      <div className="flex flex-col items-center text-sm text-gray-700">
        <Menu className="w-5 h-5" />
        Menu
      </div>
      <div className="flex flex-col items-center text-sm text-gray-700">
        <User className="w-5 h-5" />
        Akun
      </div>
    </nav>
  )
}
