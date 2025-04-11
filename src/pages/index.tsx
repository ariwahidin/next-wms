// app/page.tsx or app/page.js (for Next.js App Router)

import Image from "next/image";
import Link from "next/link";
import { useState } from 'react';

export default function Home() {

  const [isOpen, setIsOpen] = useState(false);
  return (
    <main className="bg-white text-gray-800">
      {/* Navbar */}
      <nav className="w-full bg-white shadow-md py-4 px-6 fixed top-0 left-0 z-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Image src="/images/logo.svg" alt="Logo" width={80} height={80} />
          {/* <span className="text-xl font-bold">LogistikID</span> */}
        </div>
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        <div className="hidden md:flex space-x-6">
          <Link href="/auth/login" className="hover:text-blue-500">
            Login
          </Link>
          <Link href="#hubungi" className="hover:text-blue-500">
            Help
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white px-6 py-4 shadow-md fixed top-16 w-full z-40">
          <Link
            href="/auth/login"
            className="block py-2 text-gray-700 hover:text-blue-500"
            onClick={() => setIsOpen(false)}
          >
            Login
          </Link>
          <Link
            href="#Help"
            className="block py-2 text-gray-700 hover:text-blue-500"
            onClick={() => setIsOpen(false)}
          >
            Help
          </Link>
        </div>
      )}

      <div className="pt-50">
        {/* Hero Section */}
        <section className="relative w-full h-[90vh]">
          <Image
            src="/images/wms_cover.jpeg"
            alt="Hero Logistics"
            layout="fill"
            objectFit="cover"
            className="brightness-75"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-xl">
              WMS
            </h1>
            <p className="text-lg md:text-xl mb-6 drop-shadow-lg">
              Warehouse Management System
            </p>
            {/* <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition">
              Hubungi Kami
            </button> */}
          </div>
        </section>

        {/* Services */}
        {/* <section className="py-16 px-6 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Layanan Kami</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                title: "Pengiriman Cepat",
                desc: "Layanan express untuk kebutuhan mendesak Anda.",
                img: "/images/mobile_maps.jpg",
              },
              {
                title: "Tracking Real-Time",
                desc: "Pantau pengiriman Anda secara langsung.",
                img: "/images/mobile_maps.jpg",
              },
              {
                title: "Jangkauan Luas",
                desc: "Kami melayani pengiriman ke seluruh pelosok negeri.",
                img: "/images/mobile_maps.jpg",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition"
              >
                <Image
                  src={item.img}
                  alt={item.title}
                  width={500}
                  height={300}
                  className="w-full h-60 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section> */}

        {/* Call to Action */}
        {/* <section className="relative w-full h-[60vh] mt-10">
          <Image
            src="/images/gudang.jpg"
            alt="Call to Action Truck"
            layout="fill"
            objectFit="cover"
            className="brightness-50"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Butuh Pengiriman Hari Ini?
            </h2>
            <p className="mb-6 text-lg">
              Tim kami siap membantu Anda kapan saja!
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
              Pesan Sekarang
            </button>
          </div>
        </section> */}

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6 text-center mt-0">
          <p>
            &copy; {new Date().getFullYear()} PT Yusen Logistics Puninar Indonesia. All rights
            reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
