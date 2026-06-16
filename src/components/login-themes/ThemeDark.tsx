// components/login-themes/ThemeDark.tsx
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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

export default function ThemeDark({
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
    : [{ image_url: '', title: 'Warehouse Management', subtitle: 'Efficient inventory control' }];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Left panel — image slideshow */}
      <div className="hidden lg:block relative w-1/2 overflow-hidden">
        {slides.map((slide, idx) => (
          <div key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeSlide ? 'opacity-100' : 'opacity-0'}`}>
            {slide.image_url
              ? <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, #0a0a0f, ${config.primary_color})` }} />
            }
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60" />
            {/* Slide info */}
            <div className="absolute bottom-12 left-10 right-10">
              <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: config.accent_color }} />
              <h3 className="text-2xl font-semibold text-white mb-2">{slide.title}</h3>
              <p className="text-white/50 text-sm">{slide.subtitle}</p>
            </div>
          </div>
        ))}

        {/* Top logo */}
        <div className="absolute top-10 left-10 flex items-center gap-3 z-10">
          <img src={config.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
          <span className="text-white font-semibold tracking-tight">{config.app_name}</span>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-1.5 z-10">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => setActiveSlide(idx)}
              className="w-1 rounded-full transition-all"
              style={{
                height: idx === activeSlide ? 24 : 6,
                backgroundColor: idx === activeSlide ? config.accent_color : 'rgba(255,255,255,0.2)',
              }} />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d0d14]">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <img src={config.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
          <span className="font-semibold text-white">{config.app_name}</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: config.accent_color }}>
              Secure Access
            </p>
            <h1 className="text-3xl font-semibold text-white">Sign in</h1>
            <p className="text-white/40 text-sm">{config.tagline}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 uppercase tracking-wider">Email or Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly={isPreview}
                className="w-full px-4 py-3 rounded-lg text-white placeholder:text-white/20 outline-none transition-all text-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = config.accent_color + '80')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/40 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={isPreview}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder:text-white/20 outline-none transition-all text-sm pr-11"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = config.accent_color + '80')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={isPreview ? undefined : onSubmit}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-white transition-all hover:opacity-90 mt-2 text-sm"
              style={{ backgroundColor: config.accent_color }}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>

          <p className="text-center text-xs text-white/20">
            {config.company_name}<br />
            &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}