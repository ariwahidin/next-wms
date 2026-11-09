
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Package,
  Truck,
  Ship,
  Warehouse,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { LoginConfig } from "@/types/company-config";

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
    : [
        {
          image_url: "",
          title: "Warehouse Management",
          subtitle: "Efficient inventory control",
        },
      ];

  useEffect(() => {
    setActiveSlide((current) => current % slides.length);

    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubmit = (e: React.FormEvent) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }

    onSubmit(e);
  };

  const features = [
    { icon: Warehouse, label: "Warehouse" },
    { icon: Truck, label: "Transport" },
    { icon: Ship, label: "Shipping" },
  ];

  return (
    <div
      className="relative min-h-screen min-h-[100svh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(8, 35, 59, 0.91) 0%,
            rgba(12, 48, 76, 0.82) 42%,
            rgba(19, 58, 86, 0.62) 68%,
            rgba(27, 65, 91, 0.35) 100%
          ),
          url('/images/login-bg.png')
        `,
        backgroundColor: "#173B59",
      }}
    >
      {/* Additional overlay for mobile readability */}
      <div className="absolute inset-0 bg-[#102D48]/20 pointer-events-none lg:hidden" />

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full max-w-[1250px]">

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 xl:gap-16 items-center">

          {/* =========================================
              LEFT PANEL - BRANDING & WAREHOUSE
          ========================================= */}
          <section className="w-full text-white">

            {/* BRAND */}
            <div className="flex items-center gap-3 mb-6 lg:mb-8">

              {config.logo_url ? (
                <img
                  src={config.logo_url}
                  alt="Company Logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Warehouse size={28} />
                </div>
              )}

              <div className="min-w-0">

                <h1 className="text-xl sm:text-2xl lg:text-[27px] font-bold tracking-tight text-white">
                  {config.app_name}
                </h1>

                <p className="text-[10px] sm:text-xs font-bold tracking-[0.12em] uppercase text-[#F5B942] mt-0.5">
                  {config.tagline}
                </p>

              </div>

            </div>

            {/* INTRO */}
            <div className="max-w-xl mb-6 lg:mb-7">

              <div className="flex items-center gap-2 mb-2">

                <span className="w-6 h-[2px] bg-[#F5B942]" />

                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#B9D5EB]">
                  Enterprise Warehouse Management System
                </span>

              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[18px] font-bold leading-[1.15] tracking-tight text-white">
                Connected Warehouse Operations
              </h2>

              <p className="mt-3 text-[13px] sm:text-sm text-[#E1EAF1] leading-relaxed max-w-lg">
                Streamline logistics operations with integrated warehouse,
                inventory, and transportation management.
              </p>

            </div>

            {/* CAROUSEL */}
            <div className="relative rounded-xl overflow-hidden border border-white/25 shadow-[0_12px_35px_rgba(0,0,0,0.28)] bg-[#173B59]">

              <div className="relative aspect-[16/8.5] sm:aspect-[16/8] overflow-hidden">

                {slides.map((slide, idx) => (

                  <div
                    key={idx}
                    className={`absolute inset-0 transition-all duration-700 ${
                      idx === activeSlide
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-[1.03] pointer-events-none"
                    }`}
                  >

                    {slide.image_url ? (
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#365E7C] to-[#102D48]">
                        <Warehouse
                          size={90}
                          strokeWidth={0.8}
                          className="text-white/30"
                        />
                      </div>
                    )}

                    {/* Image readability overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(7,28,46,0.94) 0%, rgba(7,28,46,0.40) 48%, rgba(7,28,46,0.03) 100%)",
                      }}
                    />

                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:p-6">

                      <div className="flex items-center gap-2 mb-1.5">

                        <span className="w-5 h-[2px] bg-[#F5B942]" />

                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5C45C]">
                          Enterprise Logistics
                        </span>

                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {slide.title}
                      </h3>

                      <p className="text-xs sm:text-[13px] text-[#D9E5EF] mt-1">
                        {slide.subtitle}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

              {/* CAROUSEL NAVIGATION */}
              <div className="absolute bottom-4 right-5 flex items-center gap-1.5 z-10">

                {slides.map((_, idx) => (

                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={idx === activeSlide ? "true" : undefined}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeSlide
                        ? "w-7 bg-[#F5B942]"
                        : "w-1.5 bg-white/50 hover:bg-white"
                    }`}
                  />

                ))}

              </div>

            </div>

            {/* FEATURES */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-5">

              {features.map((feature, idx) => (

                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-lg border border-white/20 bg-[#102D48]/45 backdrop-blur-sm px-2 sm:px-3 py-3 sm:py-3.5 transition-colors hover:bg-[#102D48]/65"
                >

                  <div className="w-9 h-9 shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-[#F5B942]">

                    <feature.icon size={19} strokeWidth={1.8} />

                  </div>

                  <span className="text-[10px] sm:text-xs font-semibold text-white">
                    {feature.label}
                  </span>

                </div>

              ))}

            </div>

            {/* LEFT FOOTER */}
            <div className="hidden lg:flex items-center gap-2 mt-6 text-[#D0DFEA]">

              <ShieldCheck size={16} />

              <span className="text-xs">
                Integrated Enterprise Operations Platform
              </span>

            </div>

          </section>

          {/* =========================================
              RIGHT PANEL - LOGIN
          ========================================= */}
          <section className="w-full flex justify-center lg:justify-end">

            <div className="w-full max-w-[455px] bg-white rounded-xl sm:rounded-2xl border border-[#DCE4EC] shadow-[0_20px_60px_rgba(4,25,44,0.22)] p-6 sm:p-8 lg:p-9 xl:p-10">

              {/* MOBILE BRAND */}
              <div className="lg:hidden flex items-center gap-2.5 mb-6 pb-5 border-b border-[#E5EAF0]">

                {config.logo_url && (
                  <img
                    src={config.logo_url}
                    alt="Company Logo"
                    className="w-11 h-11 object-contain"
                  />
                )}

                <div className="min-w-0">

                  <h1 className="text-lg font-bold text-[#223548]">
                    {config.app_name}
                  </h1>

                  <p className="text-[10px] font-semibold text-[#0A6ED1]">
                    {config.tagline}
                  </p>

                </div>

              </div>

              {/* LOGIN HEADER */}
              <div className="mb-7">

                <div className="flex items-center gap-2.5 mb-5">

                  <div className="w-10 h-10 rounded-lg bg-[#EAF3FC] flex items-center justify-center text-[#0A6ED1]">

                    <Package size={20} strokeWidth={1.8} />

                  </div>

                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#52677B]">
                    Warehouse Management System
                  </span>

                </div>

                <h2 className="text-[27px] sm:text-[25px] font-bold text-[#223548] tracking-tight">
                  Welcome Back
                </h2>

                <p className="text-[13px] text-[#60758A] mt-2">
                  Sign in to your account to continue
                </p>

              </div>

              {/* LOGIN FORM */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* USERNAME */}
                <div className="space-y-1.5">

                  <label
                    htmlFor="modern-username"
                    className="block text-[13px] font-semibold text-[#354A5F]"
                  >
                    Email or Username
                  </label>

                  <input
                    id="modern-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    readOnly={isPreview}
                    placeholder="Enter your email or username"
                    className="w-full h-[48px] px-3.5 bg-[#F8FAFC] border border-[#B8C6D3] rounded-md text-[13px] text-[#223548] placeholder:text-[#8999A8] outline-none transition-all focus:bg-white focus:border-[#0A6ED1] focus:ring-2 focus:ring-[#0A6ED1]/15"
                  />

                </div>

                {/* PASSWORD */}
                <div className="space-y-1.5">

                  <label
                    htmlFor="modern-password"
                    className="block text-[13px] font-semibold text-[#354A5F]"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="modern-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      readOnly={isPreview}
                      placeholder="Enter your password"
                      className="w-full h-[48px] px-3.5 pr-11 bg-[#F8FAFC] border border-[#B8C6D3] rounded-md text-[13px] text-[#223548] placeholder:text-[#8999A8] outline-none transition-all focus:bg-white focus:border-[#0A6ED1] focus:ring-2 focus:ring-[#0A6ED1]/15"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#60758A] hover:text-[#0A6ED1] p-1 transition-colors"
                    >

                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>

                </div>

                {/* SIGN IN */}
                <button
                  type="submit"
                  disabled={isPreview}
                  className="w-full h-[49px] rounded-md bg-[#0A6ED1] hover:bg-[#085CAF] active:bg-[#064B91] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(10,110,209,0.18)] disabled:opacity-60 disabled:cursor-not-allowed group"
                >

                  Sign In

                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />

                </button>

              </form>

              {/* COMPANY FOOTER */}
              <div className="mt-7 pt-5 border-t border-[#E3E9EF] text-center">

                <p className="text-[12px] font-medium text-[#52677B]">
                  {config.company_name}
                </p>

                <p className="text-[11px] text-[#8999A8] mt-1.5">
                  © {new Date().getFullYear()} All rights reserved
                </p>

              </div>

            </div>

          </section>

        </div>

      </div>
    </div>
  );
}
