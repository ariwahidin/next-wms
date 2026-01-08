/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Package, Truck, Ship, Warehouse, ChevronRight } from 'lucide-react';
import { BusinessUnit } from '@/types/bu';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import eventBus from '@/utils/eventBus';
import api from '@/lib/api';
import { setUser } from '@/store/userSlice';
import router from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { LoadingProvider } from '@/contexts/LoadingContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const dataUser = useSelector((state: RootState) => state.user);

  const slides = [
    {
      image: '/images/wms_cover.jpeg',
      title: 'Warehouse Management',
      subtitle: 'Efficient inventory control'
    },
    {
      image: '/images/truck_yusen2.jpeg',
      title: 'Transport Management',
      subtitle: 'Seamless delivery tracking'
    },
    {
      image: '/images/warehouse_staff.jpeg',
      title: 'Smart Logistics',
      subtitle: 'End-to-end solutions'
    },
    {
      image: '/images/drone.jpeg',
      title: 'Scalable System',
      subtitle: 'Grow your warehouse without complexity'
    },
    {
      image: '/images/tms_cover.jpeg',
      title: 'System Integration',
      subtitle: 'Connected transport and warehouse flow'
    }
  ];

  const [buOptions, setBuOptions] = useState<BusinessUnit[]>([]);
  const [bu, setBu] = useState("");


  const dispatch = useAppDispatch();

  // eventBus.emit("loading", true);

  const handleSubmit = (e: React.FormEvent) => {
    console.log("Login submitted");
    e.preventDefault();
    eventBus.emit("loading", true);
    api
      .post(
        "/auth/login",
        {
          email: username,
          password,
          // business_unit: bu,
        },
        { withCredentials: true }
      )
      .then((res) => {
        eventBus.emit("loading", false);

        if (res.data.success === true) {
          // Simpan user ke Redux
          console.log(" roles => ", res.data.user.roles);
          dispatch(
            setUser({
              name: res.data.user.name,
              email: res.data.user.email,
              base_url: res.data.user.base_url,
              token: res.data.x_token,
              menus: res.data.menus,
              unit: res.data.user.unit,
              roles: res.data.user.roles
            })
          );

          document.cookie = `wms-auth-token=${res.data.x_token
            }; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          if (res.data.user.base_url === "/dashboard") {
            router.push("/wms/dashboard");
          } else {
            router.push("/mobile/home");
          }
        }
      })
      .catch((err) => {
        eventBus.emit("loading", false);

        const status = err.response?.status;
        console.log("API Error Response sam:", err);

        if (status === 409) {
          console.log("API Error Response conflict in login:", err.response);
          const conflictId = err.response.data?.conflict_id;
          router.push(`/auth/conflict?cid=${conflictId}`);
          return;
        }

        console.log(err);
      });
    // .catch((err) => console.log(err));
  };

  // useEffect(() => {
  //   document.title = "WMS Login";
  //   // Hapus semua cookies
  //   document.cookie.split(";").forEach((cookie) => {
  //     const eqPos = cookie.indexOf("=");
  //     const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
  //     document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  //   });
  // }, []);

  useEffect(() => {
    const next_token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("wms-auth-token="))
      ?.split("=")[1];
    console.log("next token : ", next_token)

    // if (!next_token || next_token === "undefined")

    if (!next_token || next_token === "undefined") {
      // eventBus.emit("loading", false);
      console.log("Request Auth Token not found. Redirecting to login.");
    } else {
      api
        .get("/auth/is-logged-in", { withCredentials: true })
        .then((res) => {
          if (res.data.success) {
            eventBus.emit("loading", false);
            console.log("Is logged in:", res.data);
            console.log("Data user :", dataUser);
            if (dataUser.base_url === "/dashboard") {
              router.push("/wms/dashboard");
            } else {
              router.push("/mobile/home");
            }

          } else {
            document.cookie.split(";").forEach((cookie) => {
              const eqPos = cookie.indexOf("=");
              const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }

  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);




  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Logistics Icons Pattern */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(20)].map((_, i) => {
          const icons = [Package, Truck, Ship, Warehouse];
          const Icon = icons[i % icons.length];
          return (
            <Icon
              key={i}
              className="absolute text-white"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${20 + Math.random() * 30}px`,
                height: `${20 + Math.random() * 30}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          );
        })}
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-10"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Branding & Carousel */}
            <div className="hidden lg:block space-y-8">
              {/* <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white">WMS</h1>
                    <p className="text-blue-300 text-sm">Warehouse Management System</p>
                  </div>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Streamline your logistics operations with our comprehensive warehouse and transport management solution
                </p>
              </div> */}

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="p-2 ">
                    <img
                      src="/images/wms.png"
                      alt="WMS Logo"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="flex flex-col" style={{ marginLeft: '-12px' }}>
                    <h1 className="text-3xl font-bold text-white">YuTrackWMS</h1>
                    <p className="text-sm" style={{ marginTop: '-5px', color: '#FF6D10', fontWeight: 'bold' }}>Track Everything in Warehouse</p>
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
                    <div
                      key={idx}
                      className={`absolute inset-0 transition-all duration-700 ${idx === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-8">
                        <h3 className="text-2xl font-bold text-white mb-2">{slide.title}</h3>
                        <p className="text-blue-200">{slide.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${idx === activeSlide ? 'w-8 bg-blue-400' : 'w-1.5 bg-white/30'
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Warehouse, label: 'Warehouse' },
                  { icon: Truck, label: 'Transport' },
                  { icon: Ship, label: 'Shipping' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center hover:bg-slate-800/60 transition-all hover:scale-105 cursor-pointer">
                    <item.icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-300">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 border border-gray-200/50">
                {/* Mobile Logo */}
                {/* <div className="lg:hidden mb-4 text-center">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h1 className="text-2xl font-bold text-gray-900">WMS</h1>
                      <p className="text-xs text-gray-600">Warehouse Management</p>
                    </div>
                  </div>
                </div> */}

                <div className="lg:hidden flex items-center mb-5">
                  <div className="p-2 ">
                    <img
                      src="/images/wms.png"
                      alt="WMS Logo"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div style={{ marginLeft: '-8px' }}>
                    <h1 className="text-2xl font-bold text-black">YuTrackWMS</h1>
                    <p className="text-sm" style={{ marginTop: '-5px', color: '#FF6D10', fontWeight: 'bold' }}>Track Everything in Warehouse</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="hidden lg:flex flex-col text-center lg:text-left">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                    <p className="text-gray-600" style={{ marginTop: '-10px' }}>Sign in to your account to continue</p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Email or Username
                      </label>
                      <input
                        style={{ marginTop: '2px' }}
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter your email or username"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          style={{ marginTop: '-5px' }}
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3.5 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                    >
                      Sign In
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-600">
                      PT Yusen Logistics Interlink Indonesia
                    </p>
                    <p className="text-center text-xs text-gray-500 mt-1">
                      &copy; {new Date().getFullYear()} All rights reserved
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}