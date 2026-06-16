// components/login-themes/ThemeCard.tsx
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
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

export default function ThemeCard({
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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">

      {/* Full-page blurred background image */}
      <div className="absolute inset-0">
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
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'blur(2px) brightness(0.85)', transform: 'scale(1.05)' }}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${config.primary_color ?? '#166534'} 0%, #0f172a 100%)`,
                }}
              />
            )}
          </div>
        ))}
        {/* Light overlay to brighten bg slightly */}
        <div className="absolute inset-0 bg-white/20" />
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[540px]">

        {/* ── LEFT: image panel ── */}
        <div className="relative w-full lg:w-[42%] flex-shrink-0 h-56 sm:h-72 lg:h-auto overflow-hidden rounded-t-3xl lg:rounded-t-none lg:rounded-l-3xl m-3 lg:m-3">
          {/* Slide images */}
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 rounded-2xl overflow-hidden ${
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
                    background: `linear-gradient(160deg, #0f2d1a 0%, ${config.primary_color ?? '#166534'} 60%, #14532d 100%)`,
                  }}
                />
              )}
            </div>
          ))}

          {/* Gradient overlay bottom */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

          {/* Top right: logo badge */}
          <div className="absolute top-4 right-4 z-10">
            {config.logo_url ? (
              <img
                src={config.logo_url}
                alt={config.app_name}
                className="w-12 h-12 rounded-xl object-contain bg-white/90 p-1 shadow-lg"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg font-black text-white text-xl"
                style={{ background: config.primary_color ?? '#166534' }}
              >
                {config.app_name?.charAt(0) ?? 'A'}
              </div>
            )}
          </div>

          {/* Bottom text */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
              Welcome to
            </p>
            <h2 className="text-white text-2xl sm:text-3xl font-black leading-tight drop-shadow-lg">
              {currentSlide.title || config.app_name}
            </h2>
            {(currentSlide.subtitle || config.tagline) && (
              <p className="text-white/75 text-sm mt-1.5 font-medium">
                {currentSlide.subtitle || config.tagline}
              </p>
            )}

            {/* Slide dots */}
            {slides.length > 1 && (
              <div className="flex gap-1.5 mt-3">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className="h-1 rounded-full transition-all duration-300"
                    style={
                      idx === activeSlide
                        ? { width: 20, backgroundColor: 'white' }
                        : { width: 6, backgroundColor: 'rgba(255,255,255,0.4)' }
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: login form ── */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-8 sm:py-10">
          <div className="w-full max-w-sm mx-auto">

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-center mb-6 sm:mb-8 uppercase">
              Sign In Now
            </h1>

            <div className="space-y-3 sm:space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  readOnly={isPreview}
                  placeholder="Email or Username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={isPreview}
                  placeholder="Password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
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
              <div className="text-right -mt-1">
                <button
                  type="button"
                  tabIndex={isPreview ? -1 : 0}
                  className="text-xs font-semibold transition-opacity hover:opacity-75"
                  style={{ color: config.accent_color ?? config.primary_color ?? '#166534' }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In button */}
              <button
                onClick={isPreview ? undefined : onSubmit}
                className="w-full py-3 sm:py-3.5 rounded-full font-bold text-white text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] shadow-md"
                style={{
                  background: config.primary_color ?? '#166534',
                  boxShadow: `0 4px 16px ${config.primary_color ?? '#166534'}50`,
                }}
              >
                Sign In
              </button>

              {/* Footer */}
              <p className="text-center text-xs text-gray-400 pt-2">
                &copy; {new Date().getFullYear()} {config.company_name || config.app_name}. All rights reserved.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}