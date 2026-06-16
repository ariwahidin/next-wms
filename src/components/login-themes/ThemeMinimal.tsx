// components/login-themes/ThemeMinimal.tsx
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { LoginConfig } from '@/types/company-config';

type Props = {W
  config: LoginConfig;
  onSubmit: (e: React.FormEvent) => void;
  username: string;
  password: string;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  isPreview?: boolean;
};

export default function ThemeMinimal({
  config,
  onSubmit,
  username,
  password,
  setUsername,
  setPassword,
  isPreview = false,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Left accent strip */}
      <div className="hidden lg:flex w-2 flex-shrink-0" style={{ backgroundColor: config.primary_color }} />

      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 p-16"
        style={{ backgroundColor: config.primary_color }}
      >
        <div className="flex items-center gap-3">
          <img src={config.logo_url} alt="Logo" className="w-12 h-12 object-contain" />
          <span className="text-white font-bold text-xl tracking-tight">{config.app_name}</span>
        </div>

        <div className="space-y-6">
          <div className="w-12 h-0.5 bg-white/30" />
          <h2 className="text-4xl font-light text-white leading-snug">
            {config.tagline}
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Manage your entire warehouse and transport operation from a single, unified platform.
          </p>
        </div>

        <p className="text-white/40 text-xs">{config.company_name}</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <img src={config.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
          <span className="font-bold text-lg" style={{ color: config.primary_color }}>{config.app_name}</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back — enter your credentials below</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email or Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly={isPreview}
                className="w-full px-0 py-2.5 bg-transparent border-0 border-b-2 border-gray-200 focus:border-b-2 outline-none transition-colors text-gray-900 placeholder:text-gray-300"
                style={{ borderBottomColor: undefined }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = config.accent_color)}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = '#e5e7eb')}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={isPreview}
                  className="w-full px-0 py-2.5 bg-transparent border-0 border-b-2 border-gray-200 outline-none transition-colors text-gray-900 placeholder:text-gray-300 pr-8"
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = config.accent_color)}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = '#e5e7eb')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={isPreview ? undefined : onSubmit}
              className="w-full flex items-center justify-between px-6 py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 mt-2"
              style={{ backgroundColor: config.primary_color }}
            >
              <span>Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {config.company_name}
          </p>
        </div>
      </div>
    </div>
  );
}