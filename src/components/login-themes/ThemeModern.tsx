// components/login-themes/ThemeModern.tsx
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Package, Truck, Ship, Warehouse, ChevronRight } from 'lucide-react';
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

export default function ThemeModern({
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
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{
        background: `linear-gradient(135deg, #0f172a 0%, ${config.primary_color} 50%, #0f172a 100%)`,
      }}
    >
      {/* Animated blobs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ backgroundColor: config.accent_color }} />
        <div className="absolute top-40 right-20 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ backgroundColor: config.primary_color, animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/2 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
          style={{ backgroundColor: config.accent_color, animationDelay: '2s' }} />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[Package, Truck, Ship, Warehouse].map((Icon, i) => (
          <Icon key={i} className="absolute text-white"
            style={{ top: `${20 + i * 20}%`, left: `${10 + i * 22}%`, width: 32, height: 32 }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">

          {/* Left — branding & carousel */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                <img src={config.logo_url} alt="Logo" className="w-40 h-40 object-contain" />
                <div>
                  <h1 className="text-3xl font-bold text-white">{config.app_name}</h1>
                  <p className="text-sm font-bold" style={{ color: '#FF6D10' }}>{config.tagline}</p>
                </div>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                Streamline your logistics operations with our comprehensive warehouse and transport management solution
              </p>
            </div>

            {/* Carousel */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
              <div className="aspect-video relative overflow-hidden">
                {slides.map((slide, idx) => (
                  <div key={idx}
                    className={`absolute inset-0 transition-all duration-700 ${idx === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    {slide.image_url && (
                      <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{slide.title}</h3>
                      <p className="text-blue-200">{slide.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, idx) => (
                  <button key={idx} onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${idx === activeSlide ? 'w-8' : 'w-1.5 bg-white/30'}`}
                    style={idx === activeSlide ? { width: 32, backgroundColor: config.accent_color } : {}} />
                ))}
              </div>
            </div>

            {/* Feature chips */}
            <div className="grid grid-cols-3 gap-4">
              {[{ icon: Warehouse, label: 'Warehouse' }, { icon: Truck, label: 'Transport' }, { icon: Ship, label: 'Shipping' }]
                .map((item, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center">
                    <item.icon className="w-8 h-8 mx-auto mb-2" style={{ color: config.accent_color }} />
                    <p className="text-sm text-gray-300">{item.label}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Right — login form */}
          <div className="w-full">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 border border-gray-200/50">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center mb-5 gap-1">
                <img src={config.logo_url} alt="Logo" className="w-14 h-14 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold text-black">{config.app_name}</h1>
                  <p className="text-sm font-bold" style={{ color: '#FF6D10' }}>{config.tagline}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="hidden lg:block">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                  <p className="text-gray-600 text-sm">Sign in to your account to continue</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Email or Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                      readOnly={isPreview}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all"
                      style={{ ['--tw-ring-color' as string]: config.accent_color }}
                      placeholder="Enter your email or username" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        readOnly={isPreview}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none transition-all pr-12"
                        placeholder="Enter your password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button onClick={isPreview ? undefined : onSubmit}
                    className="w-full text-white py-3.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 group shadow-lg"
                    style={{ background: `linear-gradient(to right, ${config.primary_color}, ${config.accent_color})` }}>
                    Sign In
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">{config.company_name}</p>
                  <p className="text-xs text-gray-500 mt-1">&copy; {new Date().getFullYear()} All rights reserved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}