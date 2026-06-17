// components/login-themes/ThemeNebula.tsx
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LoginConfig } from '@/types/company-config';

type Props = {
  config: LoginConfig;
  onSubmit: (e: React.FormEvent) => void;
  username: string;
  password: string;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  isPreview?: boolean;
};

export default function ThemeNebula({
  config,
  onSubmit,
  username,
  password,
  setUsername,
  setPassword,
  isPreview = false,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = config.login_slides?.length
    ? config.login_slides
    : [{ image_url: '', title: '', subtitle: '' }];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[activeSlide];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f5fa] p-3 sm:p-4">
      <div className="w-full max-w-[1000px] bg-[#f8f9fd] rounded-2xl sm:rounded-[32px] shadow-xl overflow-hidden flex flex-col lg:flex-row">

        {/* ── IMAGE CARD (top on mobile, left on desktop) ── */}
        <div className="relative w-full lg:w-[50%] flex-shrink-0 h-52 sm:h-64 lg:h-auto lg:min-h-[640px] overflow-hidden rounded-t-2xl lg:rounded-t-none lg:rounded-l-[32px]">

          {/* Background slides */}
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === activeSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {slide.image_url ? (
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(160deg, #0b0726 0%, ${config.primary_color ?? '#1a103c'} 50%, #4c1d95 100%)`,
                  }}
                />
              )}
            </div>
          ))}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          {/* Top: slide title + dots */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 z-10">
            {currentSlide.title && (
              <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide drop-shadow">
                {currentSlide.title}
              </span>
            )}
            {slides.length > 1 && (
              <div className="flex items-center gap-1.5 ml-auto">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={
                      idx === activeSlide
                        ? { width: 24, backgroundColor: config.accent_color ?? '#a78bfa' }
                        : { width: 6, backgroundColor: 'rgba(255,255,255,0.35)' }
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom: app badge */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-4 sm:pb-6 z-10">
            <div
              className="inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 sm:py-3"
              style={{
                background: 'rgba(15, 23, 42, 0.50)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {config.logo_url ? (
                <img
                  src={config.logo_url}
                  alt={config.app_name}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-contain border border-white/20 flex-shrink-0"
                />
              ) : (
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${config.primary_color ?? '#4f46e5'}, ${config.accent_color ?? '#7c3aed'})`,
                  }}
                />
              )}
              <div>
                <p className="text-white text-sm font-bold tracking-wide leading-tight">
                  {config.app_name}
                </p>
                <p className="text-white/60 text-xs mt-0.5 leading-tight">
                  {config.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── LOGIN FORM (bottom on mobile, right on desktop) ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-10 lg:px-12 py-8 sm:py-10">
          <div className="w-full max-w-sm">

            {/* Logo + heading */}
            <div className="flex flex-col items-center mb-6 sm:mb-8">

              <h2 className="text-2xl sm:text-2xl font-extrabold text-[#1e293b] tracking-tight text-center">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1.5 text-center font-medium">
                Sign in to {config.app_name}
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-3 sm:space-y-4">
              {/* Email / Username */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly={isPreview}
                placeholder="Email or Username"
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all shadow-sm"
              />

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={isPreview}
                  placeholder="Password"
                  className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all pr-12 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <button
                  type="button"
                  tabIndex={isPreview ? -1 : 0}
                  className="text-xs font-semibold transition-opacity hover:opacity-75"
                  style={{ color: config.accent_color ?? '#f43f5e' }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Login button */}
              <button
                onClick={isPreview ? undefined : onSubmit}
                className="w-full py-3 sm:py-3.5 rounded-full font-bold text-white text-sm tracking-wide transition-all hover:opacity-95 active:scale-[0.98] mt-1"
                style={{
                  background: `linear-gradient(to right, ${config.primary_color ?? '#4f46e5'}, ${config.accent_color ?? '#3b82f6'})`,
                  boxShadow: `0 4px 20px ${config.primary_color ?? '#4f46e5'}40`,
                }}
              >
                Sign In
              </button>

              {/* Footer */}
              <p className="text-center text-xs text-gray-400 pt-3">
                &copy; {new Date().getFullYear()} {config.company_name || config.app_name}. All rights reserved.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}