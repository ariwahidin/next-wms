// components/login-themes/ThemeFullBg.tsx
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

export default function ThemeFullBg({
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
    : [{ image_url: '', title: config.app_name, subtitle: config.tagline }];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[activeSlide];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">

      {/* Full-screen background image */}
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
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, #0f172a 0%, ${config.primary_color} 60%, #0f172a 100%)`,
                }}
              />
            )}
          </div>
        ))}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Subtle vignette */}
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-10 flex items-center min-h-screen py-12">
        <div className="w-full grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — branding text */}
          <div className="hidden lg:flex flex-col justify-center space-y-6">
            {/* Logo + app name */}
            <div className="flex items-center gap-3 mb-2">
              {config.logo_url && (
                <img
                  src={config.logo_url}
                  alt="Logo"
                  className="w-24 h-24 object-contain drop-shadow-lg"
                />
              )}
              <span className="text-white text-lg font-semibold tracking-widest uppercase opacity-90">
                {config.app_name}
              </span>
            </div>

            {/* Big headline from current slide */}
            <div>
              <h1 className="text-6xl font-black text-white leading-none tracking-tight uppercase drop-shadow-xl">
                {currentSlide.title
                  ? currentSlide.title.split(' ').map((word, i) => (
                      <span key={i} className="block">{word}</span>
                    ))
                  : <span>{config.app_name}</span>
                }
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-white/80 text-lg font-medium max-w-sm leading-relaxed">
              {currentSlide.subtitle || config.tagline}
            </p>

            {/* Tagline sub-description */}
            <p className="text-white/55 text-sm max-w-xs leading-relaxed">
              Streamline your logistics operations with our comprehensive warehouse and transport management solution.
            </p>

            {/* Slide dots */}
            {slides.length > 1 && (
              <div className="flex gap-2 pt-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === activeSlide ? 'w-8' : 'w-2 bg-white/30'
                    }`}
                    style={idx === activeSlide ? { backgroundColor: config.accent_color, width: 32 } : {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right — glassmorphism login card */}
          <div className="w-full lg:ml-auto lg:max-w-md">
            <div
              className="rounded-2xl p-8 sm:p-10 shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              {/* Mobile: logo + brand */}
              <div className="lg:hidden flex items-center gap-3 mb-6">
                {config.logo_url && (
                  <img src={config.logo_url} alt="Logo" className="w-14 h-14 object-contain" />
                )}
                <div>
                  <p className="text-white font-bold text-base">{config.app_name}</p>
                  <p className="text-white/60 text-xs">{config.tagline}</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    readOnly={isPreview}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 outline-none transition-all text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      color: '#1e293b',
                    }}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      readOnly={isPreview}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all text-sm pr-12"
                      style={{
                        background: 'rgba(255,255,255,0.92)',
                        color: '#1e293b',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Forgot password */}
                  <div className="text-right pt-0.5">
                    <button
                      type="button"
                      className="text-xs underline underline-offset-2 transition-opacity hover:opacity-80"
                      style={{ color: config.accent_color ?? '#60a5fa' }}
                      tabIndex={isPreview ? -1 : 0}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Sign in button */}
                <button
                  onClick={isPreview ? undefined : onSubmit}
                  className="w-full py-3.5 rounded-lg font-bold text-white text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] shadow-lg mt-1"
                  style={{
                    background: config.accent_color ?? config.primary_color,
                  }}
                >
                  SIGN IN
                </button>

                {/* Footer */}
                <div className="pt-4 border-t border-white/10 text-center space-y-1">
                  <p className="text-xs text-white/50">{config.company_name}</p>
                  <p className="text-xs text-white/30">
                    &copy; {new Date().getFullYear()} All rights reserved
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}