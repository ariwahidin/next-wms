import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  allowedDevOrigins: ['*.tunnel.example.com', '127.0.0.1'],
};

export default nextConfig;
